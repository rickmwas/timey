import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { signAccessToken } from "@/server/auth/tokens";
import { AppError } from "@/server/errors/app-error";
import { GET as notificationsGet } from "@/app/api/v1/notifications/route";
import { POST as venuesPost } from "@/app/api/v1/venues/route";
import { GET as importsGet, POST as importsPost } from "@/app/api/v1/imports/route";
import { GET as announcementsGet, POST as announcementsPost } from "@/app/api/v1/announcements/route";

afterAll(async () => {
  await db.$disconnect();
});

describe("authenticated API route integration", () => {
  it("enforces roles at venue, import, and announcement routes and scopes authenticated feeds", async () => {
    const suffix = randomUUID();
    const studentId = randomUUID();
    const officerId = randomUUID();
    const departmentId = randomUUID();
    const cohortId = randomUUID();
    const studentSessionId = randomUUID();
    const officerSessionId = randomUUID();
    const studentEmail = `route-student-${suffix}@test.invalid`;
    const officerEmail = `route-officer-${suffix}@test.invalid`;
    const studentInstitutionalId = `RS-${suffix}`;
    const officerInstitutionalId = `RO-${suffix}`;

    try {
      await db.department.create({ data: { id: departmentId, code: `RD-${suffix}`, name: "Route Department", school: "Test School" } });
      await db.cohort.create({ data: { id: cohortId, code: `RC-${suffix}`, name: "Route Cohort", departmentId } });
      await db.user.createMany({
        data: [
          { id: studentId, email: studentEmail, institutionalId: studentInstitutionalId, fullName: "Route Student", passwordHash: "unused", role: Role.STUDENT, cohortId, departmentId, mustChangePassword: false },
          { id: officerId, email: officerEmail, institutionalId: officerInstitutionalId, fullName: "Route Officer", passwordHash: "unused", role: Role.TIMETABLE_OFFICER, departmentId, mustChangePassword: false },
        ],
      });
      await db.authSession.createMany({
        data: [
          { id: studentSessionId, userId: studentId, familyId: randomUUID(), refreshTokenHash: `route-student-${suffix}`, expiresAt: new Date(Date.now() + 60_000) },
          { id: officerSessionId, userId: officerId, familyId: randomUUID(), refreshTokenHash: `route-officer-${suffix}`, expiresAt: new Date(Date.now() + 60_000) },
        ],
      });
      const studentToken = await signAccessToken({ userId: studentId, sessionId: studentSessionId, role: Role.STUDENT });
      const officerToken = await signAccessToken({ userId: officerId, sessionId: officerSessionId, role: Role.TIMETABLE_OFFICER });

      const request = (path: string, token: string, method = "GET", body?: unknown) => new NextRequest(`http://localhost:3000${path}`, {
        method,
        headers: {
          cookie: `timy_access=${token}`,
          origin: "http://localhost:3000",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

      const studentFeed = await notificationsGet(request("/api/v1/notifications", studentToken));
      expect(studentFeed.status).toBe(200);
      expect((await studentFeed.json()).data.unreadCount).toBe(0);

      const officerImports = await importsGet(request("/api/v1/imports", officerToken));
      expect(officerImports.status).toBe(200);
      expect((await officerImports.json()).data.items).toEqual([]);

      const deniedVenue = await venuesPost(request("/api/v1/venues", studentToken, "POST", {
        code: `DENY-${suffix}`, name: "Denied Venue", building: "Test Building",
      }));
      expect(deniedVenue.status).toBe(403);

      const deniedImport = await importsPost(request("/api/v1/imports", studentToken, "POST"));
      expect(deniedImport.status).toBe(403);

      const deniedAnnouncement = await announcementsPost(request("/api/v1/announcements", studentToken, "POST", {
        title: "Denied announcement", content: "Not allowed", cohortId: randomUUID(),
      }));
      expect(deniedAnnouncement.status).toBe(403);

      const studentAnnouncements = await announcementsGet(request("/api/v1/announcements", studentToken));
      expect(studentAnnouncements.status).toBe(200);
      expect((await studentAnnouncements.json()).data.items).toEqual([]);
    } finally {
      await db.authSession.deleteMany({ where: { id: { in: [studentSessionId, officerSessionId] } } });
      await db.user.deleteMany({ where: { id: { in: [studentId, officerId] } } });
      await db.cohort.deleteMany({ where: { id: cohortId } });
      await db.department.deleteMany({ where: { id: departmentId } });
    }
  });
});