import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { cursorPage } from "@/server/http/pagination";

export type VenueListInput = {
  building?: string;
  search?: string;
  cursor?: string;
  limit: number;
};

export type VenueInput = {
  code: string;
  name: string;
  building: string;
  floor?: number;
  capacity?: number;
  isUnderMaintenance?: boolean;
};

export async function listDepartments() {
  return db.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          courses: { where: { isActive: true } },
          cohorts: { where: { isActive: true } },
          users: { where: { role: "LECTURER", status: "ACTIVE" } },
        },
      },
    },
  });
}

export async function getActiveAcademicPeriod() {
  return db.academicPeriod.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, year: true, semester: true, startDate: true, endDate: true },
  });
}

export async function listCohorts() {
  const cohorts = await db.cohort.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      department: { select: { id: true, code: true, name: true, school: true } },
      offerings: {
        where: { isActive: true, period: { isActive: true } },
        take: 1,
        select: {
          period: { select: { year: true, semester: true } },
          _count: { select: { timetableEntries: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  return cohorts.map(({ offerings, ...cohort }) => ({
    ...cohort,
    academicYear: offerings[0]?.period.year ?? null,
    semester: offerings[0]?.period.semester ?? null,
    classCount: offerings.reduce((total, offering) => total + offering._count.timetableEntries, 0),
  }));
}

export async function listCourses() {
  const courses = await db.course.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    include: {
      department: { select: { id: true, code: true, name: true, school: true } },
      offerings: {
        where: { isActive: true, period: { isActive: true } },
        select: {
          _count: { select: { timetableEntries: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  return courses.map(({ offerings, ...course }) => ({
    ...course,
    scheduledSlots: offerings.reduce((total, offering) => total + offering._count.timetableEntries, 0),
  }));
}

export async function listVenues(input: VenueListInput) {
  const rows = await db.venue.findMany({
    where: {
      ...(input.building ? { building: { contains: input.building, mode: "insensitive" } } : {}),
      ...(input.search ? {
        OR: [
          { code: { contains: input.search, mode: "insensitive" } },
          { name: { contains: input.search, mode: "insensitive" } },
          { building: { contains: input.search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: [{ building: "asc" }, { name: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  return cursorPage(rows, input.limit);
}

export async function createVenue(input: VenueInput, actorId: string) {
  try {
    return await db.$transaction(async (transaction) => {
      const venue = await transaction.venue.create({
        data: {
          code: input.code.trim(),
          name: input.name.trim(),
          building: input.building.trim(),
          floor: input.floor ?? 1,
          capacity: input.capacity ?? 100,
          isUnderMaintenance: input.isUnderMaintenance ?? false,
        },
      });
      await transaction.auditLog.create({
        data: { actorId, action: "VENUE_CREATED", entityType: "Venue", entityId: venue.id, metadata: { code: venue.code } },
      });
      return venue;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("DUPLICATE_RESOURCE", "A venue with this code or name already exists", 409);
    }
    throw error;
  }
}

export async function updateVenue(id: string, input: Partial<VenueInput>, actorId: string) {
  try {
    return await db.$transaction(async (transaction) => {
      const existing = await transaction.venue.findUnique({ where: { id } });
      if (!existing) throw new AppError("NOT_FOUND", "Venue not found", 404);
      const venue = await transaction.venue.update({
        where: { id },
        data: {
          ...(input.code ? { code: input.code.trim() } : {}),
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.building ? { building: input.building.trim() } : {}),
          ...(input.floor !== undefined ? { floor: input.floor } : {}),
          ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
          ...(input.isUnderMaintenance !== undefined ? { isUnderMaintenance: input.isUnderMaintenance } : {}),
        },
      });
      await transaction.auditLog.create({
        data: { actorId, action: "VENUE_UPDATED", entityType: "Venue", entityId: id, metadata: { code: venue.code } },
      });
      return venue;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("DUPLICATE_RESOURCE", "A venue with this code or name already exists", 409);
    }
    throw error;
  }
}

export async function deactivateVenue(id: string, actorId: string) {
  return db.$transaction(async (transaction) => {
    const row = await transaction.venue.findUnique({ where: { id } });
    if (!row) throw new AppError("NOT_FOUND", "Venue not found", 404);
    const venue = await transaction.venue.update({ where: { id }, data: { isActive: false } });
    await transaction.auditLog.create({
      data: { actorId, action: "VENUE_DEACTIVATED", entityType: "Venue", entityId: id, metadata: { code: venue.code } },
    });
    return venue;
  });
}
