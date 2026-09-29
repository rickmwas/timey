import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { correctImportRow, createImport, discardImport, getImport, publishImport, validateImport } from "@/server/services/imports";
import { localFileStorage } from "@/server/storage/local-file-storage";

afterAll(async () => {
  await db.$disconnect();
});

describe("timetable import lifecycle", () => {
  it("uploads, rejects duplicate bytes, corrects, validates, publishes, and notifies", async () => {
    const suffix = randomUUID();
    const ids = {
      actor: randomUUID(), department: randomUUID(), cohort: randomUUID(), course: randomUUID(),
      period: randomUUID(), offering: randomUUID(), lecturer: randomUUID(), student: randomUUID(), venue: randomUUID(),
    };
    const actor = {
      id: ids.actor,
      email: `importer-${suffix}@test.invalid`,
      institutionalId: `IO-${suffix}`,
      fullName: "Import Officer",
      role: Role.TIMETABLE_OFFICER,
      cohortId: null,
      departmentId: ids.department,
      mustChangePassword: false,
      sessionId: randomUUID(),
    };
    const bytes = new TextEncoder().encode(
      `Course Code,Venue,Day,Time,Lecturer,Cohort\nIMP 101,Hall ${suffix},Mon,09:00-11:00,Import Lecturer,Import Cohort ${suffix}\n`,
    );
    const jobIds: string[] = [];
    const storageKeys: string[] = [];

    try {
      await db.department.create({ data: { id: ids.department, code: `ID-${suffix}`, name: "Import Department", school: "Test School" } });
      await db.cohort.create({ data: { id: ids.cohort, code: `IC-${suffix}`, name: `Import Cohort ${suffix}`, departmentId: ids.department } });
      await db.course.create({ data: { id: ids.course, code: "IMP 101", title: "Import Test", departmentId: ids.department } });
      await db.academicPeriod.create({
        data: { id: ids.period, name: `Import Period ${suffix}`, year: `imp-${suffix}`, semester: 1, startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-12-31T00:00:00.000Z") },
      });
      await db.courseOffering.create({ data: { id: ids.offering, courseId: ids.course, cohortId: ids.cohort, periodId: ids.period } });
      await db.user.create({
        data: { id: ids.actor, email: actor.email, institutionalId: actor.institutionalId, fullName: actor.fullName, passwordHash: "unused", role: Role.TIMETABLE_OFFICER, departmentId: ids.department, mustChangePassword: false },
      });
      await db.user.create({
        data: { id: ids.lecturer, email: `lecturer-${suffix}@test.invalid`, institutionalId: `IL-${suffix}`, fullName: "Import Lecturer", passwordHash: "unused", role: Role.LECTURER, departmentId: ids.department, mustChangePassword: false },
      });
      await db.user.create({
        data: { id: ids.student, email: `student-${suffix}@test.invalid`, institutionalId: `IS-${suffix}`, fullName: "Import Student", passwordHash: "unused", role: Role.STUDENT, cohortId: ids.cohort, departmentId: ids.department, mustChangePassword: false },
      });
      await db.venue.create({ data: { id: ids.venue, code: `IV-${suffix}`, name: `Hall ${suffix}`, building: "Import Block" } });

      const job = await createImport(actor, { periodId: ids.period, fileName: `timetable-${suffix}.csv`, mimeType: "text/csv", contents: bytes });
      jobIds.push(job.id);
      storageKeys.push(job.storageKey);
      expect(job.status).toBe("PARSED");
      expect(job.totalRows).toBe(1);
      await expect(createImport(actor, { periodId: ids.period, fileName: `duplicate-${suffix}.csv`, mimeType: "text/csv", contents: bytes }))
        .rejects.toMatchObject({ code: "DUPLICATE_IMPORT", statusCode: 409 });

      const initial = await getImport(job.id);
      const stagedRow = initial.stagedEntries[0];
      await expect(correctImportRow(job.id, stagedRow.id, { expectedVersion: 99, rawVenue: `Hall ${suffix}` }))
        .rejects.toMatchObject({ code: "IMPORT_VERSION_CONFLICT", statusCode: 409 });
      await correctImportRow(job.id, stagedRow.id, { expectedVersion: 1, rawVenue: `Hall ${suffix}` });
      const validated = await validateImport(job.id, 2);
      expect(validated.status).toBe("VALIDATED");
      expect(validated.validRows).toBe(1);
      expect(validated.conflictRows).toBe(0);

      const published = await publishImport(job.id, actor, 3);
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedCount).toBe(1);
      expect(published.notificationCount).toBe(1);
      expect(await db.timetableEntry.count({ where: { periodId: ids.period, status: "ACTIVE" } })).toBe(1);
      expect(await db.notification.count({ where: { recipientId: ids.student, type: "ANNOUNCEMENT" } })).toBe(1);
      expect(await db.auditLog.count({ where: { actorId: ids.actor, entityId: job.id, action: "IMPORT_PUBLISHED" } })).toBe(1);
    } finally {
      if (jobIds.length > 0) {
        await db.notification.deleteMany({ where: { recipientId: ids.student } });
        await db.auditLog.deleteMany({ where: { entityId: { in: jobIds } } });
        await db.importJob.deleteMany({ where: { id: { in: jobIds } } });
      }
      await db.timetableEntry.deleteMany({ where: { periodId: ids.period } });
      await db.user.deleteMany({ where: { id: { in: [ids.actor, ids.lecturer, ids.student] } } });
      await db.courseOffering.deleteMany({ where: { id: ids.offering } });
      await db.course.deleteMany({ where: { id: ids.course } });
      await db.cohort.deleteMany({ where: { id: ids.cohort } });
      await db.venue.deleteMany({ where: { id: ids.venue } });
      await db.academicPeriod.deleteMany({ where: { id: ids.period } });
      await db.department.deleteMany({ where: { id: ids.department } });
      await Promise.all(storageKeys.map((key) => localFileStorage.delete(key)));
    }
  });

  it("discards a staged import and removes its stored file", async () => {
    const suffix = randomUUID();
    const ids = { actor: randomUUID(), department: randomUUID(), period: randomUUID() };
    const actor = {
      id: ids.actor,
      email: `discard-${suffix}@test.invalid`,
      institutionalId: `D-${suffix}`,
      fullName: "Discard Officer",
      role: Role.TIMETABLE_OFFICER,
      cohortId: null,
      departmentId: ids.department,
      mustChangePassword: false,
      sessionId: randomUUID(),
    };
    const bytes = new TextEncoder().encode(`Course,Venue,Day,Time,Lecturer,Cohort\nD 101,X,Mon,09:00-10:00,L,C\n`);
    let jobId: string | undefined;
    let storageKey: string | undefined;

    try {
      await db.department.create({ data: { id: ids.department, code: `DD-${suffix}`, name: "Discard Department", school: "Test School" } });
      await db.academicPeriod.create({
        data: { id: ids.period, name: `Discard Period ${suffix}`, year: `disc-${suffix}`, semester: 1, startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-12-31T00:00:00.000Z") },
      });
      await db.user.create({
        data: { id: ids.actor, email: actor.email, institutionalId: actor.institutionalId, fullName: actor.fullName, passwordHash: "unused", role: Role.TIMETABLE_OFFICER, departmentId: ids.department, mustChangePassword: false },
      });
      const job = await createImport(actor, { periodId: ids.period, fileName: `discard-${suffix}.csv`, mimeType: "text/csv", contents: bytes });
      jobId = job.id;
      storageKey = job.storageKey;
      expect(await discardImport(job.id, actor, 1)).toMatchObject({ status: "DISCARDED" });
      await expect(localFileStorage.get(job.storageKey)).rejects.toBeInstanceOf(AppError);
    } finally {
      if (jobId) {
        await db.auditLog.deleteMany({ where: { entityId: jobId } });
        await db.importJob.deleteMany({ where: { id: jobId } });
      }
      await db.user.deleteMany({ where: { id: ids.actor } });
      await db.academicPeriod.deleteMany({ where: { id: ids.period } });
      await db.department.deleteMany({ where: { id: ids.department } });
      if (storageKey) await localFileStorage.delete(storageKey);
    }
  });
});