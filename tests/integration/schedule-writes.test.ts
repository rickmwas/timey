import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { writeScheduleChange } from "@/server/services/schedule-writes";
import { readEffectiveTimetable } from "@/server/services/timetable-reads";

afterAll(async () => {
  await db.$disconnect();
});

describe("schedule write concurrency", () => {
  it("allows only one simultaneous write with the same expected entry version", async () => {
    const suffix = randomUUID();
    const ids = {
      department: randomUUID(),
      cohort: randomUUID(),
      course: randomUUID(),
      period: randomUUID(),
      offering: randomUUID(),
      lecturer: randomUUID(),
      student: randomUUID(),
      venue: randomUUID(),
      entry: randomUUID(),
    };

    try {
      await db.department.create({
        data: { id: ids.department, code: `D-${suffix}`, name: "Test Department", school: "Test School" },
      });
      await db.cohort.create({
        data: { id: ids.cohort, code: `C-${suffix}`, name: "Test Cohort", departmentId: ids.department },
      });
      await db.course.create({
        data: { id: ids.course, code: `T-${suffix}`, title: "Test Course", departmentId: ids.department },
      });
      await db.academicPeriod.create({
        data: {
          id: ids.period,
          name: `Test period ${suffix}`,
          year: `test-${suffix}`,
          semester: 1,
          startDate: new Date("2026-09-01T00:00:00.000Z"),
          endDate: new Date("2026-12-31T00:00:00.000Z"),
        },
      });
      await db.courseOffering.create({
        data: { id: ids.offering, courseId: ids.course, cohortId: ids.cohort, periodId: ids.period },
      });
      await db.user.create({
        data: {
          id: ids.lecturer,
          email: `lecturer-${suffix}@test.invalid`,
          institutionalId: `L-${suffix}`,
          fullName: "Test Lecturer",
          passwordHash: "unused",
          role: Role.LECTURER,
          departmentId: ids.department,
          mustChangePassword: false,
        },
      });
      await db.user.create({
        data: {
          id: ids.student,
          email: `student-${suffix}@test.invalid`,
          institutionalId: `S-${suffix}`,
          fullName: "Test Student",
          passwordHash: "unused",
          role: Role.STUDENT,
          cohortId: ids.cohort,
          departmentId: ids.department,
          mustChangePassword: false,
        },
      });
      await db.venue.create({
        data: { id: ids.venue, code: `V-${suffix}`, name: `Venue ${suffix}`, building: "Test Building" },
      });
      await db.timetableEntry.create({
        data: {
          id: ids.entry,
          offeringId: ids.offering,
          periodId: ids.period,
          lecturerId: ids.lecturer,
          venueId: ids.venue,
          day: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
        },
      });

      const actor = {
        id: ids.lecturer,
        email: `lecturer-${suffix}@test.invalid`,
        institutionalId: `L-${suffix}`,
        fullName: "Test Lecturer",
        role: Role.LECTURER,
        cohortId: null,
        departmentId: ids.department,
        mustChangePassword: false,
        sessionId: randomUUID(),
      };
      const payload = {
        occurrenceDate: "2026-10-05",
        expectedVersion: 1,
        reason: "Concurrent version test",
        startTime: "11:00",
        endTime: "12:00",
      };
      const idempotencyKeys = [randomUUID(), randomUUID()];

      const results = await Promise.allSettled([
        writeScheduleChange("reschedule", ids.entry, actor, { ...payload, replacementDate: "2026-10-12" }, idempotencyKeys[0]),
        writeScheduleChange("reschedule", ids.entry, actor, { ...payload, replacementDate: "2026-10-19" }, idempotencyKeys[1]),
      ]);

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const rejected = results.find((result) => result.status === "rejected");
      expect(rejected?.status).toBe("rejected");
      if (rejected?.status === "rejected") {
        expect(rejected.reason).toBeInstanceOf(AppError);
        expect((rejected.reason as AppError).statusCode).toBe(409);
      }
      expect(await db.scheduleChange.count({ where: { entryId: ids.entry } })).toBe(1);
      expect(await db.scheduleOverride.count({ where: { entryId: ids.entry } })).toBe(1);
      expect(await db.notification.count({ where: { recipientId: ids.student } })).toBe(1);
      expect((await db.timetableEntry.findUniqueOrThrow({ where: { id: ids.entry } })).version).toBe(2);

      const studentActor = {
        id: ids.student,
        email: `student-${suffix}@test.invalid`,
        institutionalId: `S-${suffix}`,
        fullName: "Test Student",
        role: Role.STUDENT,
        cohortId: ids.cohort,
        departmentId: ids.department,
        mustChangePassword: false,
        sessionId: randomUUID(),
      };
      const readQuery = {
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        periodId: ids.period,
        cursor: undefined,
        limit: 25,
      };
      const rescheduledSchedule = await readEffectiveTimetable(studentActor, readQuery);
      expect(rescheduledSchedule.items).toEqual(expect.arrayContaining([
        expect.objectContaining({
          entryId: ids.entry,
          occurrenceDate: "2026-10-05",
          effectiveDate: "2026-10-12",
          status: "RESCHEDULED",
        }),
      ]));
      const otherCohortSchedule = await readEffectiveTimetable(
        { ...studentActor, cohortId: randomUUID() },
        readQuery,
      );
      expect(otherCohortSchedule.items).toHaveLength(0);

      const successfulIndex = results.findIndex((result) => result.status === "fulfilled");
      const replay = await writeScheduleChange(
        "reschedule",
        ids.entry,
        actor,
        { ...payload, replacementDate: successfulIndex === 0 ? "2026-10-12" : "2026-10-19" },
        idempotencyKeys[successfulIndex],
      );
      expect(replay.replayed).toBe(true);
      expect(await db.scheduleChange.count({ where: { entryId: ids.entry } })).toBe(1);

      const unauthorizedActor = { ...actor, id: randomUUID() };
      await expect(writeScheduleChange(
        "cancel",
        ids.entry,
        unauthorizedActor,
        { occurrenceDate: "2026-10-05", expectedVersion: 2, reason: "Unauthorized attempt" },
        randomUUID(),
      )).rejects.toMatchObject({ statusCode: 403 });

      const cancellation = await writeScheduleChange(
        "cancel",
        ids.entry,
        actor,
        { occurrenceDate: "2026-10-05", expectedVersion: 2, reason: "Lecturer unavailable" },
        randomUUID(),
      );
      expect(cancellation.change.changeType).toBe("CANCELLATION");
      expect(cancellation.override?.type).toBe("CANCELLED");

      const postponement = await writeScheduleChange(
        "postpone",
        ids.entry,
        actor,
        { occurrenceDate: "2026-10-05", replacementDate: "2026-10-26", expectedVersion: 3, reason: "Date to be confirmed" },
        randomUUID(),
      );
      expect(postponement.change.changeType).toBe("POSTPONEMENT");
      expect(postponement.override?.type).toBe("POSTPONED");
      const postponedSchedule = await readEffectiveTimetable(studentActor, readQuery);
      expect(postponedSchedule.items).toEqual(expect.arrayContaining([
        expect.objectContaining({
          entryId: ids.entry,
          occurrenceDate: "2026-10-05",
          effectiveDate: "2026-10-26",
          status: "POSTPONED",
          startTime: null,
          venue: null,
        }),
      ]));
      expect(await db.scheduleChange.count({ where: { entryId: ids.entry } })).toBe(3);
      expect(await db.notification.count({ where: { recipientId: ids.student } })).toBe(3);
      expect((await db.timetableEntry.findUniqueOrThrow({ where: { id: ids.entry } })).version).toBe(4);
    } finally {
      await db.notification.deleteMany({ where: { sourceChange: { entryId: ids.entry } } });
      await db.scheduleChange.deleteMany({ where: { entryId: ids.entry } });
      await db.scheduleOverride.deleteMany({ where: { entryId: ids.entry } });
      await db.auditLog.deleteMany({ where: { entityId: ids.entry } });
      await db.timetableEntry.deleteMany({ where: { id: ids.entry } });
      await db.user.deleteMany({ where: { id: { in: [ids.lecturer, ids.student] } } });
      await db.courseOffering.deleteMany({ where: { id: ids.offering } });
      await db.course.deleteMany({ where: { id: ids.course } });
      await db.cohort.deleteMany({ where: { id: ids.cohort } });
      await db.venue.deleteMany({ where: { id: ids.venue } });
      await db.academicPeriod.deleteMany({ where: { id: ids.period } });
      await db.department.deleteMany({ where: { id: ids.department } });
    }
  });
});