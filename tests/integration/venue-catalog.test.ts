import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { createVenue, deactivateVenue, updateVenue } from "@/server/services/catalog";
import { findAvailableVenues } from "@/server/services/timetable";

afterAll(async () => {
  await db.$disconnect();
});

describe("venue catalog integration", () => {
  it("audits venue lifecycle changes and excludes maintenance rooms from availability", async () => {
    const actorId = randomUUID();
    let venueId: string | undefined;
    const suffix = randomUUID();

    try {
      await db.user.create({
        data: {
          id: actorId,
          email: `officer-${suffix}@test.invalid`,
          institutionalId: `O-${suffix}`,
          fullName: "Test Timetable Officer",
          passwordHash: "unused",
          role: Role.TIMETABLE_OFFICER,
          mustChangePassword: false,
        },
      });
      const created = await createVenue({
        code: `VM-${suffix}`,
        name: `Maintenance Room ${suffix}`,
        building: "Test Building",
        capacity: 40,
        isUnderMaintenance: true,
      }, actorId);
      venueId = created.id;
      expect(created.isUnderMaintenance).toBe(true);

      const available = findAvailableVenues(
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00" },
        [{
          id: created.id,
          code: created.code,
          name: created.name,
          building: created.building,
          capacity: created.capacity,
          isActive: created.isActive,
          isUnderMaintenance: created.isUnderMaintenance,
        }],
        [],
      );
      expect(available.availableVenues).toHaveLength(0);

      const updated = await updateVenue(created.id, { isUnderMaintenance: false, capacity: 45 }, actorId);
      expect(updated.isUnderMaintenance).toBe(false);
      expect(updated.capacity).toBe(45);
      const deactivated = await deactivateVenue(created.id, actorId);
      expect(deactivated.isActive).toBe(false);

      const actions = await db.auditLog.findMany({
        where: { actorId, entityId: created.id },
        select: { action: true },
        orderBy: { createdAt: "asc" },
      });
      expect(actions.map(({ action }) => action)).toEqual(["VENUE_CREATED", "VENUE_UPDATED", "VENUE_DEACTIVATED"]);
    } finally {
      if (venueId) {
        await db.auditLog.deleteMany({ where: { entityId: venueId } });
        await db.venue.deleteMany({ where: { id: venueId } });
      }
      await db.user.deleteMany({ where: { id: actorId } });
    }
  });
});