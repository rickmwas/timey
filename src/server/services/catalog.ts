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
};

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

export async function createVenue(input: VenueInput) {
  try {
    return await db.venue.create({
      data: {
        code: input.code.trim(),
        name: input.name.trim(),
        building: input.building.trim(),
        floor: input.floor ?? 1,
        capacity: input.capacity ?? 100,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("DUPLICATE_RESOURCE", "A venue with this code or name already exists", 409);
    }
    throw error;
  }
}

export async function updateVenue(id: string, input: Partial<VenueInput>) {
  const venue = await db.venue.findUnique({ where: { id } });
  if (!venue) throw new AppError("NOT_FOUND", "Venue not found", 404);

  try {
    return await db.venue.update({
      where: { id },
      data: {
        ...(input.code ? { code: input.code.trim() } : {}),
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.building ? { building: input.building.trim() } : {}),
        ...(input.floor !== undefined ? { floor: input.floor } : {}),
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("DUPLICATE_RESOURCE", "A venue with this code or name already exists", 409);
    }
    throw error;
  }
}

export async function deactivateVenue(id: string) {
  const row = await db.venue.findUnique({ where: { id } });
  if (!row) throw new AppError("NOT_FOUND", "Venue not found", 404);
  return db.venue.update({ where: { id }, data: { isActive: false } });
}
