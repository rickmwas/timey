import { hash } from "bcryptjs";
import { PrismaClient, Role, DayOfWeek } from "@prisma/client";

const prisma = new PrismaClient();

type SeedRole = "STUDENT" | "LECTURER" | "TIMETABLE_OFFICER" | "ADMIN";

function getEnvOrDefault(name: string, fallback: string): string {
  const val = process.env[name]?.trim();
  return val && val.length > 0 ? val : fallback;
}

function seedUserConfig(role: SeedRole) {
  const defaults: Record<SeedRole, { email: string; id: string; pass: string }> = {
    STUDENT: { email: "student@kisii.ac.ke", id: "IN16/00015/24", pass: "Password123!" },
    LECTURER: { email: "lecturer@kisii.ac.ke", id: "KSU/STAFF/4012", pass: "Password123!" },
    TIMETABLE_OFFICER: { email: "officer@kisii.ac.ke", id: "KSU/OFFICER/1004", pass: "Password123!" },
    ADMIN: { email: "admin@kisii.ac.ke", id: "KSU/ADMIN/0001", pass: "Password123!" },
  };

  const prefix = `SEED_${role}`;
  const email = getEnvOrDefault(`${prefix}_EMAIL`, defaults[role].email).toLowerCase();
  const institutionalId = getEnvOrDefault(`${prefix}_ID`, defaults[role].id);
  const password = getEnvOrDefault(`${prefix}_PASSWORD`, defaults[role].pass);
  if (password.length < 8) throw new Error(`${prefix}_PASSWORD must contain at least 8 characters`);
  return { role, email, institutionalId, password };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed must not run in production");
  }

  // 1. Department
  const department = await prisma.department.upsert({
    where: { code: "COMP_SCI" },
    update: {
      name: "Department of Computing Sciences",
      school: "School of Information Science and Technology",
      isActive: true,
    },
    create: {
      code: "COMP_SCI",
      name: "Department of Computing Sciences",
      school: "School of Information Science and Technology",
    },
  });

  // 2. Cohorts
  const cohortSe = await prisma.cohort.upsert({
    where: { code: "IN16-Y2" },
    update: {
      name: "BSc Software Engineering Year 2",
      departmentId: department.id,
      expectedSize: 55,
      isActive: true,
    },
    create: {
      code: "IN16-Y2",
      name: "BSc Software Engineering Year 2",
      departmentId: department.id,
      expectedSize: 55,
    },
  });

  const cohortCs = await prisma.cohort.upsert({
    where: { code: "IN14-Y3" },
    update: {
      name: "BSc Computer Science Year 3",
      departmentId: department.id,
      expectedSize: 65,
      isActive: true,
    },
    create: {
      code: "IN14-Y3",
      name: "BSc Computer Science Year 3",
      departmentId: department.id,
      expectedSize: 65,
    },
  });

  // 3. Academic Period
  const period = await prisma.academicPeriod.upsert({
    where: { year_semester: { year: "2026/2027", semester: 1 } },
    update: {
      name: "Semester 1 2026/2027",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-12-20T00:00:00.000Z"),
      isActive: true,
    },
    create: {
      name: "Semester 1 2026/2027",
      year: "2026/2027",
      semester: 1,
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-12-20T00:00:00.000Z"),
      isActive: true,
    },
  });

  await prisma.academicPeriod.updateMany({
    where: { id: { not: period.id }, isActive: true },
    data: { isActive: false },
  });

  // 4. Courses
  const courseSoen311 = await prisma.course.upsert({
    where: { code: "SOEN 311" },
    update: { title: "Advanced Software Engineering", departmentId: department.id, credits: 3, isActive: true },
    create: { code: "SOEN 311", title: "Advanced Software Engineering", departmentId: department.id, credits: 3 },
  });

  const courseComp210 = await prisma.course.upsert({
    where: { code: "COMP 210" },
    update: { title: "Computer Systems & Assembly", departmentId: department.id, credits: 3, isActive: true },
    create: { code: "COMP 210", title: "Computer Systems & Assembly", departmentId: department.id, credits: 3 },
  });

  const courseSoen312 = await prisma.course.upsert({
    where: { code: "SOEN 312" },
    update: { title: "Software Testing & Quality Assurance", departmentId: department.id, credits: 3, isActive: true },
    create: { code: "SOEN 312", title: "Software Testing & Quality Assurance", departmentId: department.id, credits: 3 },
  });

  const courseComp315 = await prisma.course.upsert({
    where: { code: "COMP 315" },
    update: { title: "Distributed Systems & Cloud Computing", departmentId: department.id, credits: 3, isActive: true },
    create: { code: "COMP 315", title: "Distributed Systems & Cloud Computing", departmentId: department.id, credits: 3 },
  });

  // 5. Venues
  const venueLh26 = await prisma.venue.upsert({
    where: { code: "LH_26" },
    update: { name: "LH 26", building: "Science & Computing Complex", floor: 1, capacity: 120, isActive: true },
    create: { code: "LH_26", name: "LH 26", building: "Science & Computing Complex", floor: 1, capacity: 120 },
  });

  const venueLh28 = await prisma.venue.upsert({
    where: { code: "LH_28" },
    update: { name: "LH 28", building: "Science & Computing Complex", floor: 1, capacity: 100, isActive: true },
    create: { code: "LH_28", name: "LH 28", building: "Science & Computing Complex", floor: 1, capacity: 100 },
  });

  const venueLab1 = await prisma.venue.upsert({
    where: { code: "LAB_1" },
    update: { name: "Computer Lab 1", building: "Science & Computing Complex", floor: 2, capacity: 45, isActive: true },
    create: { code: "LAB_1", name: "Computer Lab 1", building: "Science & Computing Complex", floor: 2, capacity: 45 },
  });

  const venueMacAud = await prisma.venue.upsert({
    where: { code: "MAC_AUD" },
    update: { name: "Main Auditorium", building: "Main Academic Complex", floor: 1, capacity: 350, isActive: true },
    create: { code: "MAC_AUD", name: "Main Auditorium", building: "Main Academic Complex", floor: 1, capacity: 350 },
  });

  // 6. Venue Aliases
  const aliasMappings: Array<{ venueId: string; aliases: string[] }> = [
    { venueId: venueLh26.id, aliases: ["lh26", "lh-26", "lh 26", "lecture hall 26"] },
    { venueId: venueLh28.id, aliases: ["lh28", "lh-28", "lh 28", "lecture hall 28"] },
    { venueId: venueLab1.id, aliases: ["lab1", "lab-1", "lab 1", "computer lab 1"] },
    { venueId: venueMacAud.id, aliases: ["auditorium", "main auditorium", "mac aud"] },
  ];

  for (const map of aliasMappings) {
    for (const alias of map.aliases) {
      await prisma.venueAlias.upsert({
        where: { normalizedAlias: alias },
        update: { alias, venueId: map.venueId },
        create: { alias, normalizedAlias: alias, venueId: map.venueId },
      });
    }
  }

  // 7. Users
  const users: Record<SeedRole, string> = {} as Record<SeedRole, string>;
  const userData: Array<{ role: SeedRole; fullName: string; cohortId: string | null; departmentId: string }> = [
    { role: "STUDENT", fullName: "Erick Mwangi (Student)", cohortId: cohortSe.id, departmentId: department.id },
    { role: "LECTURER", fullName: "Dr. Judith Ouma (Lecturer)", cohortId: null, departmentId: department.id },
    { role: "TIMETABLE_OFFICER", fullName: "Meshack Kemboi (Timetable Officer)", cohortId: null, departmentId: department.id },
    { role: "ADMIN", fullName: "System Administrator", cohortId: null, departmentId: department.id },
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
        mustChangePassword: false,
        passwordHash,
        cohortId: data.cohortId,
        departmentId: data.departmentId,
      },
      create: {
        email: config.email,
        institutionalId: config.institutionalId,
        fullName: data.fullName,
        role: config.role as Role,
        mustChangePassword: false,
        passwordHash,
        cohortId: data.cohortId,
        departmentId: data.departmentId,
      },
    });
    users[data.role] = user.id;
  }

  // 8. Course Offerings
  const offeringSoen311 = await prisma.courseOffering.upsert({
    where: { courseId_cohortId_periodId: { courseId: courseSoen311.id, cohortId: cohortSe.id, periodId: period.id } },
    update: { isActive: true },
    create: { courseId: courseSoen311.id, cohortId: cohortSe.id, periodId: period.id },
  });

  const offeringComp210 = await prisma.courseOffering.upsert({
    where: { courseId_cohortId_periodId: { courseId: courseComp210.id, cohortId: cohortSe.id, periodId: period.id } },
    update: { isActive: true },
    create: { courseId: courseComp210.id, cohortId: cohortSe.id, periodId: period.id },
  });

  const offeringSoen312 = await prisma.courseOffering.upsert({
    where: { courseId_cohortId_periodId: { courseId: courseSoen312.id, cohortId: cohortSe.id, periodId: period.id } },
    update: { isActive: true },
    create: { courseId: courseSoen312.id, cohortId: cohortSe.id, periodId: period.id },
  });

  const offeringComp315 = await prisma.courseOffering.upsert({
    where: { courseId_cohortId_periodId: { courseId: courseComp315.id, cohortId: cohortCs.id, periodId: period.id } },
    update: { isActive: true },
    create: { courseId: courseComp315.id, cohortId: cohortCs.id, periodId: period.id },
  });

  // 9. Timetable Entries
  const timetableSlots = [
    {
      offeringId: offeringSoen311.id,
      periodId: period.id,
      lecturerId: users.LECTURER,
      venueId: venueLh26.id,
      day: DayOfWeek.MONDAY,
      startTime: "09:00",
      endTime: "11:00",
      status: "ACTIVE" as const,
      version: 1,
    },
    {
      offeringId: offeringComp210.id,
      periodId: period.id,
      lecturerId: users.LECTURER,
      venueId: venueLh28.id,
      day: DayOfWeek.TUESDAY,
      startTime: "11:00",
      endTime: "13:00",
      status: "ACTIVE" as const,
      version: 1,
    },
    {
      offeringId: offeringSoen312.id,
      periodId: period.id,
      lecturerId: users.LECTURER,
      venueId: venueLab1.id,
      day: DayOfWeek.WEDNESDAY,
      startTime: "14:00",
      endTime: "17:00",
      status: "ACTIVE" as const,
      version: 1,
    },
    {
      offeringId: offeringComp315.id,
      periodId: period.id,
      lecturerId: users.LECTURER,
      venueId: venueMacAud.id,
      day: DayOfWeek.THURSDAY,
      startTime: "08:00",
      endTime: "11:00",
      status: "ACTIVE" as const,
      version: 1,
    },
  ];

  for (const slot of timetableSlots) {
    const existing = await prisma.timetableEntry.findFirst({
      where: {
        offeringId: slot.offeringId,
        day: slot.day,
        startTime: slot.startTime,
      },
    });

    if (existing) {
      await prisma.timetableEntry.update({ where: { id: existing.id }, data: slot });
    } else {
      await prisma.timetableEntry.create({ data: slot });
    }
  }

  // 10. Welcome Announcement
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { title: "Welcome to Semester 1 2026/2027 Timetable" },
  });

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to Semester 1 2026/2027 Timetable",
        content: "Master timetable has been published. Please verify your scheduled lecture halls and timings. Any clashing sessions should be reported to the departmental timetable coordinator.",
        priority: "NORMAL",
        authorId: users.TIMETABLE_OFFICER,
        cohortId: cohortSe.id,
      },
    });
  }

  console.info("Kisii University development seed completed successfully:", {
    department: department.code,
    cohorts: [cohortSe.code, cohortCs.code],
    period: period.name,
    venues: [venueLh26.code, venueLh28.code, venueLab1.code, venueMacAud.code],
    rolesSeeded: Object.keys(users),
  });
}

main()
  .catch((error: unknown) => {
    console.error("Development seed failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
