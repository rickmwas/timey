-- Step 1: Add new Enum values safely
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COD';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEAN';

ALTER TYPE "ScheduleChangeType" ADD VALUE IF NOT EXISTS 'LECTURER_SUBSTITUTION';

DO $$ BEGIN
    CREATE TYPE "DegreeLevel" AS ENUM ('CERTIFICATE', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TeachingRole" AS ENUM ('PRIMARY', 'CO_LECTURER', 'ASSISTANT', 'LAB_INSTRUCTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TeachingAssignmentStatus" AS ENUM ('ASSIGNED', 'CONFIRMED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'COMPLETED', 'AUDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EnrollmentType" AS ENUM ('REGULAR', 'ELECTIVE', 'RETAKE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ResolutionState" AS ENUM ('EXACT_MATCH', 'ALIAS_MATCH', 'AMBIGUOUS', 'UNMATCHED', 'INVALID', 'CONFLICT', 'VALIDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create new standalone tables
CREATE TABLE IF NOT EXISTS "School" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "School_name_key" ON "School"("name");
CREATE INDEX IF NOT EXISTS "School_isActive_idx" ON "School"("isActive");

-- Step 3: Add schoolId to Department and backfill existing text values
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "schoolId" UUID;

INSERT INTO "School" ("code", "name")
SELECT 
    UPPER(REGEXP_REPLACE(school, '[^a-zA-Z0-9]', '_', 'g')),
    school
FROM "Department"
WHERE school IS NOT NULL AND school != ''
ON CONFLICT ("name") DO NOTHING;

UPDATE "Department" d
SET "schoolId" = s."id"
FROM "School" s
WHERE d."school" = s."name" AND d."schoolId" IS NULL;

DO $$ BEGIN
    ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" 
        FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "Department_schoolId_isActive_idx" ON "Department"("schoolId", "isActive");

-- Step 4: Create Programme & ProgrammeCourse
CREATE TABLE IF NOT EXISTS "Programme" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL DEFAULT 'UNDERGRADUATE',
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "departmentId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Programme_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Programme_code_key" ON "Programme"("code");
CREATE INDEX IF NOT EXISTS "Programme_departmentId_isActive_idx" ON "Programme"("departmentId", "isActive");

CREATE TABLE IF NOT EXISTS "ProgrammeCourse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programmeId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "yearLevel" INTEGER NOT NULL DEFAULT 1,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgrammeCourse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProgrammeCourse_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgrammeCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProgrammeCourse_programmeId_courseId_key" ON "ProgrammeCourse"("programmeId", "courseId");
CREATE INDEX IF NOT EXISTS "ProgrammeCourse_programmeId_yearLevel_semester_idx" ON "ProgrammeCourse"("programmeId", "yearLevel", "semester");

-- Step 5: Cohort and User linkages
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "programmeId" UUID;
DO $$ BEGIN
    ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_programmeId_fkey" 
        FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "Cohort_programmeId_isActive_idx" ON "Cohort"("programmeId", "isActive");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "schoolId" UUID;
DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" 
        FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "User_departmentId_role_status_idx" ON "User"("departmentId", "role", "status");
CREATE INDEX IF NOT EXISTS "User_schoolId_role_status_idx" ON "User"("schoolId", "role", "status");

-- Step 6: TeachingAssignment table
CREATE TABLE IF NOT EXISTS "TeachingAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offeringId" UUID NOT NULL,
    "lecturerId" UUID NOT NULL,
    "role" "TeachingRole" NOT NULL DEFAULT 'PRIMARY',
    "workloadHours" DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    "status" "TeachingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeachingAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeachingAssignment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeachingAssignment_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeachingAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "TeachingAssignment_offeringId_lecturerId_key" ON "TeachingAssignment"("offeringId", "lecturerId");
CREATE INDEX IF NOT EXISTS "TeachingAssignment_lecturerId_status_idx" ON "TeachingAssignment"("lecturerId", "status");
CREATE INDEX IF NOT EXISTS "TeachingAssignment_offeringId_idx" ON "TeachingAssignment"("offeringId");

-- Step 7: StudentEnrollment table
CREATE TABLE IF NOT EXISTS "StudentEnrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'REGULAR',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEnrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentEnrollment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentEnrollment_studentId_offeringId_key" ON "StudentEnrollment"("studentId", "offeringId");
CREATE INDEX IF NOT EXISTS "StudentEnrollment_studentId_periodId_status_idx" ON "StudentEnrollment"("studentId", "periodId", "status");
CREATE INDEX IF NOT EXISTS "StudentEnrollment_offeringId_status_idx" ON "StudentEnrollment"("offeringId", "status");

-- Step 8: Linkage from TimetableEntry and ScheduleOverride
ALTER TABLE "TimetableEntry" ADD COLUMN IF NOT EXISTS "teachingAssignmentId" UUID;
DO $$ BEGIN
    ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teachingAssignmentId_fkey" 
        FOREIGN KEY ("teachingAssignmentId") REFERENCES "TeachingAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ScheduleOverride" ADD COLUMN IF NOT EXISTS "replacementLecturerId" UUID;
DO $$ BEGIN
    ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_replacementLecturerId_fkey" 
        FOREIGN KEY ("replacementLecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 9: StagedTimetableEntry resolution status & trace
ALTER TABLE "StagedTimetableEntry" ADD COLUMN IF NOT EXISTS "resolutionStatus" "ResolutionState";
ALTER TABLE "StagedTimetableEntry" ADD COLUMN IF NOT EXISTS "resolutionTrace" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Step 10: CourseAlias and LecturerAlias
CREATE TABLE IF NOT EXISTS "CourseAlias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "courseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseAlias_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CourseAlias_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseAlias_normalizedAlias_key" ON "CourseAlias"("normalizedAlias");
CREATE INDEX IF NOT EXISTS "CourseAlias_courseId_idx" ON "CourseAlias"("courseId");

CREATE TABLE IF NOT EXISTS "LecturerAlias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "lecturerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LecturerAlias_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LecturerAlias_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "LecturerAlias_normalizedAlias_key" ON "LecturerAlias"("normalizedAlias");
CREATE INDEX IF NOT EXISTS "LecturerAlias_lecturerId_idx" ON "LecturerAlias"("lecturerId");

-- Step 11: OutboxEvent and ClassReminderLog
CREATE TABLE IF NOT EXISTS "OutboxEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregateType" VARCHAR(64) NOT NULL,
    "aggregateId" UUID NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OutboxEvent_status_nextRetryAt_idx" ON "OutboxEvent"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

CREATE TABLE IF NOT EXISTS "ClassReminderLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entryId" UUID NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "windowType" VARCHAR(20) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassReminderLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClassReminderLog_entryId_occurrenceDate_windowType_key" ON "ClassReminderLog"("entryId", "occurrenceDate", "windowType");
CREATE INDEX IF NOT EXISTS "ClassReminderLog_occurrenceDate_windowType_idx" ON "ClassReminderLog"("occurrenceDate", "windowType");
