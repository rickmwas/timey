-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'TIMETABLE_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('UPLOADED', 'PARSED', 'VALIDATED', 'PUBLISHED', 'DISCARDED', 'FAILED');

-- CreateEnum
CREATE TYPE "StagedValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'CONFLICT');

-- CreateEnum
CREATE TYPE "ScheduleOverrideType" AS ENUM ('CANCELLED', 'POSTPONED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "ScheduleChangeType" AS ENUM ('CANCELLED', 'POSTPONED', 'RESCHEDULED', 'ENTRY_CREATED', 'ENTRY_UPDATED', 'ENTRY_ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SCHEDULE_CANCELLED', 'SCHEDULE_POSTPONED', 'SCHEDULE_RESCHEDULED', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'URGENT');

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedSize" INTEGER NOT NULL DEFAULT 50,
    "departmentId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" UUID NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueAlias" (
    "id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "venueId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "institutionalId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "passwordChangedAt" TIMESTAMP(3),
    "cohortId" UUID,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "lecturerId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "archiveReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleOverride" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "type" "ScheduleOverrideType" NOT NULL,
    "replacementDay" "DayOfWeek",
    "replacementStartTime" TEXT,
    "replacementEndTime" TEXT,
    "replacementVenueId" UUID,
    "reason" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleChange" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "overrideId" UUID,
    "changeType" "ScheduleChangeType" NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "conflictRows" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "checksum" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagedTimetableEntry" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "rawRowIndex" INTEGER NOT NULL,
    "rawCourseCode" TEXT,
    "rawCourseTitle" TEXT,
    "rawVenue" TEXT,
    "rawDay" TEXT,
    "rawTime" TEXT,
    "rawLecturer" TEXT,
    "rawCohort" TEXT,
    "resolvedCourseId" UUID,
    "resolvedVenueId" UUID,
    "resolvedLecturerId" UUID,
    "resolvedCohortId" UUID,
    "resolvedOfferingId" UUID,
    "normalizedDay" "DayOfWeek",
    "normalizedStartTime" TEXT,
    "normalizedEndTime" TEXT,
    "validationStatus" "StagedValidationStatus" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "conflicts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StagedTimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "sourceChangeId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "cohortId" UUID,
    "offeringId" UUID,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_code_key" ON "Cohort"("code");

-- CreateIndex
CREATE INDEX "Cohort_departmentId_isActive_idx" ON "Cohort"("departmentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_departmentId_isActive_idx" ON "Course"("departmentId", "isActive");

-- CreateIndex
CREATE INDEX "AcademicPeriod_isActive_startDate_endDate_idx" ON "AcademicPeriod"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPeriod_year_semester_key" ON "AcademicPeriod"("year", "semester");

-- CreateIndex
CREATE INDEX "CourseOffering_periodId_cohortId_isActive_idx" ON "CourseOffering"("periodId", "cohortId", "isActive");

-- CreateIndex
CREATE INDEX "CourseOffering_courseId_periodId_idx" ON "CourseOffering"("courseId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_cohortId_periodId_key" ON "CourseOffering"("courseId", "cohortId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_code_key" ON "Venue"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_key" ON "Venue"("name");

-- CreateIndex
CREATE INDEX "Venue_building_isActive_capacity_idx" ON "Venue"("building", "isActive", "capacity");

-- CreateIndex
CREATE UNIQUE INDEX "VenueAlias_normalizedAlias_key" ON "VenueAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "VenueAlias_venueId_idx" ON "VenueAlias"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_institutionalId_key" ON "User"("institutionalId");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_cohortId_role_status_idx" ON "User"("cohortId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_replacedById_key" ON "AuthSession"("replacedById");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_expiresAt_idx" ON "AuthSession"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "TimetableEntry_periodId_day_venueId_status_idx" ON "TimetableEntry"("periodId", "day", "venueId", "status");

-- CreateIndex
CREATE INDEX "TimetableEntry_periodId_day_lecturerId_status_idx" ON "TimetableEntry"("periodId", "day", "lecturerId", "status");

-- CreateIndex
CREATE INDEX "TimetableEntry_periodId_day_offeringId_status_idx" ON "TimetableEntry"("periodId", "day", "offeringId", "status");

-- CreateIndex
CREATE INDEX "TimetableEntry_offeringId_status_idx" ON "TimetableEntry"("offeringId", "status");

-- CreateIndex
CREATE INDEX "ScheduleOverride_occurrenceDate_type_idx" ON "ScheduleOverride"("occurrenceDate", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleOverride_entryId_occurrenceDate_key" ON "ScheduleOverride"("entryId", "occurrenceDate");

-- CreateIndex
CREATE INDEX "ScheduleChange_entryId_createdAt_idx" ON "ScheduleChange"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduleChange_actorId_createdAt_idx" ON "ScheduleChange"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_createdById_createdAt_idx" ON "ImportJob"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_periodId_status_createdAt_idx" ON "ImportJob"("periodId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportJob_periodId_checksum_key" ON "ImportJob"("periodId", "checksum");

-- CreateIndex
CREATE INDEX "StagedTimetableEntry_jobId_validationStatus_idx" ON "StagedTimetableEntry"("jobId", "validationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StagedTimetableEntry_jobId_rawRowIndex_key" ON "StagedTimetableEntry"("jobId", "rawRowIndex");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientId_sourceChangeId_key" ON "Notification"("recipientId", "sourceChangeId");

-- CreateIndex
CREATE INDEX "Announcement_cohortId_archivedAt_expiresAt_createdAt_idx" ON "Announcement"("cohortId", "archivedAt", "expiresAt", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_offeringId_archivedAt_expiresAt_createdAt_idx" ON "Announcement"("offeringId", "archivedAt", "expiresAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueAlias" ADD CONSTRAINT "VenueAlias_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "AuthSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TimetableEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_replacementVenueId_fkey" FOREIGN KEY ("replacementVenueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleChange" ADD CONSTRAINT "ScheduleChange_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TimetableEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleChange" ADD CONSTRAINT "ScheduleChange_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "ScheduleOverride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleChange" ADD CONSTRAINT "ScheduleChange_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagedTimetableEntry" ADD CONSTRAINT "StagedTimetableEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sourceChangeId_fkey" FOREIGN KEY ("sourceChangeId") REFERENCES "ScheduleChange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
