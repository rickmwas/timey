import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

type SeedRole = "STUDENT" | "LECTURER" | "TIMETABLE_OFFICER" | "ADMIN";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set before running the development seed`);
  return value;
}

function seedUserConfig(role: SeedRole) {
  const prefix = `SEED_${role}`;
  const email = requiredEnvironment(`${prefix}_EMAIL`).toLowerCase();
  const institutionalId = requiredEnvironment(`${prefix}_ID`);
  const password = requiredEnvironment(`${prefix}_PASSWORD`);
  if (password.length < 10) throw new Error(`${prefix}_PASSWORD must contain at least 10 characters`);
  return { role, email, institutionalId, password };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed must not run in production");
  }

  const department = await prisma.department.upsert({
    where: { code: "COMP_SCI" },
    update: { name: "Department of Computing Sciences", school: "School of Information Science and Technology", isActive: true },
    create: { code: "COMP_SCI", name: "Department of Computing Sciences", school: "School of Information Science and Technology" },
  });

  const cohort = await prisma.cohort.upsert({
    where: { code: "IN16-Y2" },
    update: { name: "BSc Software Engineering Year 2", departmentId: department.id, expectedSize: 50, isActive: true },
    create: { code: "IN16-Y2", name: "BSc Software Engineering Year 2", departmentId: department.id, expectedSize: 50 },
  });

  const period = await prisma.academicPeriod.upsert({
    where: { year_semester: { year: "2026/2027", semester: 1 } },
    update: { name: "Semester 1 2026/2027", startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-12-20T00:00:00.000Z"), isActive: true },
    create: { name: "Semester 1 2026/2027", year: "2026/2027", semester: 1, startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-12-20T00:00:00.000Z"), isActive: true },
  });

  await prisma.academicPeriod.updateMany({ where: { id: { not: period.id }, isActive: true }, data: { isActive: false } });

  const course = await prisma.course.upsert({
    where: { code: "SOEN 311" },
    update: { title: "Advanced Software Engineering", departmentId: department.id, credits: 3, isActive: true },
    create: { code: "SOEN 311", title: "Advanced Software Engineering", departmentId: department.id, credits: 3 },
  });

  const venue = await prisma.venue.upsert({
    where: { code: "LH_26" },
    update: { name: "LH 26", building: "Science and Computing Complex", floor: 1, capacity: 120, isActive: true },
    create: { code: "LH_26", name: "LH 26", building: "Science and Computing Complex", floor: 1, capacity: 120 },
  });

  for (const alias of ["lh26", "lh-26", "lecture hall 26"]) {
    await prisma.venueAlias.upsert({
      where: { normalizedAlias: alias },
      update: { alias, venueId: venue.id },
      create: { alias, normalizedAlias: alias, venueId: venue.id },
    });
  }

  const lab = await prisma.venue.upsert({
    where: { code: "LAB_1" },
    update: { name: "Computer Lab 1", building: "Science and Computing Complex", floor: 1, capacity: 40, isActive: true },
    create: { code: "LAB_1", name: "Computer Lab 1", building: "Science and Computing Complex", floor: 1, capacity: 40 },
  });

  const users: Record<SeedRole, string> = {} as Record<SeedRole, string>;
  const userData: Array<{ role: SeedRole; fullName: string; cohortId: string | null; departmentId: string }> = [
    { role: "STUDENT", fullName: "Timy Development Student", cohortId: cohort.id, departmentId: department.id },
    { role: "LECTURER", fullName: "Timy Development Lecturer", cohortId: null, departmentId: department.id },
    { role: "TIMETABLE_OFFICER", fullName: "Timy Development Officer", cohortId: null, departmentId: department.id },
    { role: "ADMIN", fullName: "Timy Development Administrator", cohortId: null, departmentId: department.id },
  ];

  for (const data of userData) {
    const config = seedUserConfig(data.role);
    const passwordHash = await hash(config.password, 12);
    const user = await prisma.user.upsert({
      where: { email: config.email },
      update: {
        institutionalId: config.institutionalId,
        fullName: data.fullName,
        role: config.role as Role,
        status: "ACTIVE",
        mustChangePassword: true,
        passwordHash,
        cohortId: data.cohortId,
        departmentId: data.departmentId,
      },
      create: {
        email: config.email,
        institutionalId: config.institutionalId,
        fullName: data.fullName,
        role: config.role as Role,
        mustChangePassword: true,
        passwordHash,
        cohortId: data.cohortId,
        departmentId: data.departmentId,
      },
    });
    users[data.role] = user.id;
  }

  const offering = await prisma.courseOffering.upsert({
    where: { courseId_cohortId_periodId: { courseId: course.id, cohortId: cohort.id, periodId: period.id } },
    update: { isActive: true },
    create: { courseId: course.id, cohortId: cohort.id, periodId: period.id },
  });

  const existingSlot = await prisma.timetableEntry.findFirst({
    where: { offeringId: offering.id, day: "MONDAY", startTime: "09:00" },
  });
  const slotData = {
    offeringId: offering.id,
    periodId: period.id,
    lecturerId: users.LECTURER,
    venueId: venue.id,
    day: "MONDAY" as const,
    startTime: "09:00",
    endTime: "11:00",
    status: "ACTIVE" as const,
    version: 1,
  };

  if (existingSlot) {
    await prisma.timetableEntry.update({ where: { id: existingSlot.id }, data: slotData });
  } else {
    await prisma.timetableEntry.create({ data: slotData });
  }

  console.info("Development seed completed", {
    department: department.code,
    cohort: cohort.code,
    period: period.name,
    venues: [venue.code, lab.code],
    rolesSeeded: Object.keys(users),
  });
}

main()
  .catch((error: unknown) => {
    console.error("Development seed failed", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());