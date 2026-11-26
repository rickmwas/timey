import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { AnnouncementPriority, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { archiveAnnouncement, createAnnouncement, listAnnouncements, updateAnnouncement } from "@/server/services/announcements";

afterAll(async () => {
  await db.$disconnect();
});

describe("scoped announcements", () => {
  it("enforces lecturer author scope and student cohort/offering visibility, expiry, archive, and notifications", async () => {
    const suffix = randomUUID();
    const ids = {
      department: randomUUID(), cohort: randomUUID(), otherCohort: randomUUID(), course: randomUUID(), period: randomUUID(),
      offering: randomUUID(), lecturer: randomUUID(), otherLecturer: randomUUID(), student: randomUUID(), otherStudent: randomUUID(),
      announcement: randomUUID(), expiredAnnouncement: randomUUID(), archivedAnnouncement: randomUUID(),
    };
    const createdIds: string[] = [];
    const actor = {
      id: ids.lecturer,
      email: `announce-${suffix}@test.invalid`,
      institutionalId: `AL-${suffix}`,
      fullName: "Assigned Lecturer",
      role: Role.LECTURER,
      cohortId: null,
      departmentId: ids.department,
      mustChangePassword: false,
      sessionId: randomUUID(),
    };
    const studentActor = {
      id: ids.student,
      email: `announce-student-${suffix}@test.invalid`,
      institutionalId: `AS-${suffix}`,
      fullName: "Target Student",
      role: Role.STUDENT,
      cohortId: ids.cohort,
      departmentId: ids.department,
      mustChangePassword: false,
      sessionId: randomUUID(),
    };

    try {
      await db.department.create({ data: { id: ids.department, code: `AD-${suffix}`, name: "Announcement Department", school: "Test School" } });
      await db.cohort.createMany({ data: [
        { id: ids.cohort, code: `AC-${suffix}`, name: `Audience ${suffix}`, departmentId: ids.department },
        { id: ids.otherCohort, code: `AX-${suffix}`, name: `Other ${suffix}`, departmentId: ids.department },
      ] });
      await db.course.create({ data: { id: ids.course, code: `ANN-${suffix}`, title: "Announcement Course", departmentId: ids.department } });
      await db.academicPeriod.create({
        data: { id: ids.period, name: `Announcement Period ${suffix}`, year: `ann-${suffix}`, semester: 1, startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-12-31T00:00:00.000Z") },
      });
      await db.courseOffering.create({ data: { id: ids.offering, courseId: ids.course, cohortId: ids.cohort, periodId: ids.period } });
      await db.user.createMany({ data: [
        { id: ids.lecturer, email: actor.email, institutionalId: actor.institutionalId, fullName: actor.fullName, passwordHash: "unused", role: Role.LECTURER, departmentId: ids.department, mustChangePassword: false },
        { id: ids.otherLecturer, email: `other-${suffix}@test.invalid`, institutionalId: `OL-${suffix}`, fullName: "Other Lecturer", passwordHash: "unused", role: Role.LECTURER, departmentId: ids.department, mustChangePassword: false },
        { id: ids.student, email: studentActor.email, institutionalId: studentActor.institutionalId, fullName: studentActor.fullName, passwordHash: "unused", role: Role.STUDENT, cohortId: ids.cohort, departmentId: ids.department, mustChangePassword: false },
        { id: ids.otherStudent, email: `other-student-${suffix}@test.invalid`, institutionalId: `OS-${suffix}`, fullName: "Other Student", passwordHash: "unused", role: Role.STUDENT, cohortId: ids.otherCohort, departmentId: ids.department, mustChangePassword: false },
      ] });
      await db.venue.create({ data: { code: `AV-${suffix}`, name: `Announcement Venue ${suffix}`, building: "Test Building" } });
      const venue = await db.venue.findUniqueOrThrow({ where: { code: `AV-${suffix}` } });
      await db.timetableEntry.create({
        data: { offeringId: ids.offering, periodId: ids.period, lecturerId: ids.lecturer, venueId: venue.id, day: "MONDAY", startTime: "09:00", endTime: "10:00" },
      });

      const announcement = await createAnnouncement(actor, {
        title: "Room update",
        content: "The class will use the east entrance.",
        offeringId: ids.offering,
        priority: AnnouncementPriority.URGENT,
        expiresAt: "2026-12-01T12:00:00.000Z",
      });
      createdIds.push(announcement.id);
      await expect(createAnnouncement({ ...actor, id: ids.otherLecturer }, {
        title: "Unauthorized target",
        content: "This should not publish.",
        offeringId: ids.offering,
      })).rejects.toBeInstanceOf(AppError);

      await db.announcement.createMany({ data: [
        { id: ids.expiredAnnouncement, title: "Expired", content: "Expired", authorId: ids.lecturer, cohortId: ids.cohort, expiresAt: new Date("2026-01-01T00:00:00.000Z") },
        { id: ids.archivedAnnouncement, title: "Archived", content: "Archived", authorId: ids.lecturer, cohortId: ids.cohort, archivedAt: new Date() },
      ] });
      const visible = await listAnnouncements(studentActor, { limit: 25 });
      expect(visible.items.map((item) => item.id)).toContain(announcement.id);
      expect(visible.items.map((item) => item.id)).not.toContain(ids.expiredAnnouncement);
      expect(visible.items.map((item) => item.id)).not.toContain(ids.archivedAnnouncement);
      expect((await listAnnouncements({ ...studentActor, id: ids.otherStudent, cohortId: ids.otherCohort }, { limit: 25 })).items).toHaveLength(0);
      expect(await db.notification.count({ where: { recipientId: ids.student, type: "ANNOUNCEMENT" } })).toBe(1);
      expect(await db.notification.count({ where: { recipientId: ids.otherStudent, type: "ANNOUNCEMENT" } })).toBe(0);

      const updated = await updateAnnouncement(actor, announcement.id, { title: "Updated room update" });
      expect(updated.title).toBe("Updated room update");
      await expect(updateAnnouncement({ ...actor, id: ids.otherLecturer }, announcement.id, { content: "No access" }))
        .rejects.toMatchObject({ statusCode: 403 });
      await archiveAnnouncement(actor, announcement.id);
      expect((await listAnnouncements(studentActor, { limit: 25 })).items.map((item) => item.id)).not.toContain(announcement.id);
      expect(await db.auditLog.count({ where: { entityType: "Announcement", entityId: announcement.id } })).toBe(3);
    } finally {
      const announcementIds = [ids.announcement, ids.expiredAnnouncement, ids.archivedAnnouncement, ...createdIds];
      await db.notification.deleteMany({ where: { recipientId: { in: [ids.student, ids.otherStudent] }, type: "ANNOUNCEMENT" } });
      await db.auditLog.deleteMany({ where: { entityType: "Announcement", entityId: { in: announcementIds } } });
      await db.announcement.deleteMany({ where: { id: { in: announcementIds } } });
      await db.timetableEntry.deleteMany({ where: { offeringId: ids.offering } });
      await db.venue.deleteMany({ where: { code: `AV-${suffix}` } });
      await db.user.deleteMany({ where: { id: { in: [ids.lecturer, ids.otherLecturer, ids.student, ids.otherStudent] } } });
      await db.courseOffering.deleteMany({ where: { id: ids.offering } });
      await db.course.deleteMany({ where: { id: ids.course } });
      await db.academicPeriod.deleteMany({ where: { id: ids.period } });
      await db.cohort.deleteMany({ where: { id: { in: [ids.cohort, ids.otherCohort] } } });
      await db.department.deleteMany({ where: { id: ids.department } });
    }
  });
});