import { createHash, randomUUID } from "node:crypto";
import { basename } from "node:path";
import { ImportStatus, Prisma, Role, StagedValidationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { cursorPage } from "@/server/http/pagination";
import type { AuthenticatedUser } from "@/server/middleware/require-user";
import { detectSlotConflicts, type SlotLike } from "@/server/services/conflicts";
import { MAX_IMPORT_BYTES, normalizeDay, normalizeTimeRange, parseTimetableFile, type ParsedImportRow } from "@/server/services/import-parser";
import { createNotificationBatch } from "@/server/services/notifications";
import { fileStorage } from "@/server/storage/file-storage-provider";

export type ImportListInput = { cursor?: string; limit: number; status?: ImportStatus };
export type ImportRowCorrection = Partial<Omit<ParsedImportRow, "rawRowIndex">> & { expectedVersion: number };

export function toImportResponse<T extends { storageKey: string }>(job: T) {
  const { storageKey: _storageKey, ...publicJob } = job;
  return publicJob;
}

function normalizeEntity(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new AppError("DUPLICATE_IMPORT", "This file has already been imported for the selected academic period", 409);
  }
  throw error;
}

function assertExpectedVersion(actual: number, expected: number): void {
  if (actual !== expected) throw new AppError("IMPORT_VERSION_CONFLICT", "Import changed since it was loaded; refresh and retry", 409);
}

function assertImportMutable(status: ImportStatus): void {
  if (status === ImportStatus.PUBLISHED || status === ImportStatus.DISCARDED) {
    throw new AppError("IMPORT_NOT_MUTABLE", "Published or discarded imports cannot be changed", 409);
  }
}

async function makeResolver(transaction: Prisma.TransactionClient, periodId: string) {
  const [courses, venues, aliases, cohorts, lecturers, offerings] = await Promise.all([
    transaction.course.findMany({ where: { isActive: true }, select: { id: true, code: true, title: true } }),
    transaction.venue.findMany({ where: { isActive: true, isUnderMaintenance: false }, select: { id: true, code: true, name: true } }),
    transaction.venueAlias.findMany({ select: { normalizedAlias: true, venueId: true } }),
    transaction.cohort.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true } }),
    transaction.user.findMany({ where: { role: Role.LECTURER, status: "ACTIVE" }, select: { id: true, email: true, institutionalId: true, fullName: true } }),
    transaction.courseOffering.findMany({ where: { periodId, isActive: true }, select: { id: true, courseId: true, cohortId: true } }),
  ]);
  const aliasesByName = new Map(aliases.map((alias) => [alias.normalizedAlias, alias.venueId]));

  return (row: ParsedImportRow) => {
    const errors: string[] = [];
    const courseKey = normalizeEntity(row.rawCourseCode ?? "");
    const course = courses.find((item) => normalizeEntity(item.code) === courseKey)
      ?? courses.find((item) => row.rawCourseTitle && normalizeEntity(item.title) === normalizeEntity(row.rawCourseTitle));
    if (!course) errors.push(`Course not found: ${row.rawCourseCode ?? row.rawCourseTitle ?? "blank"}`);

    const venueKey = normalizeEntity(row.rawVenue ?? "");
    const aliasVenueId = aliasesByName.get(venueKey);
    const venue = venues.find((item) => normalizeEntity(item.code) === venueKey || normalizeEntity(item.name) === venueKey || item.id === aliasVenueId);
    if (!venue) errors.push(`Venue not found or unavailable: ${row.rawVenue ?? "blank"}`);

    const dayText = normalizeDay(row.rawDay ?? "");
    if (!dayText) errors.push(`Day is invalid: ${row.rawDay ?? "blank"}`);
    const time = normalizeTimeRange(row.rawTime ?? "");
    if (!time) errors.push(`Time range is invalid: ${row.rawTime ?? "blank"}`);

    const lecturerKey = normalizeEntity(row.rawLecturer ?? "");
    const lecturer = lecturers.find((item) =>
      normalizeEntity(item.email) === lecturerKey ||
      normalizeEntity(item.institutionalId) === lecturerKey ||
      normalizeEntity(item.fullName) === lecturerKey,
    );
    if (!lecturer) errors.push(`Lecturer not found: ${row.rawLecturer ?? "blank"}`);

    const cohortKey = normalizeEntity(row.rawCohort ?? "");
    const cohort = cohorts.find((item) => normalizeEntity(item.code) === cohortKey || normalizeEntity(item.name) === cohortKey);
    if (!cohort) errors.push(`Cohort not found: ${row.rawCohort ?? "blank"}`);

    const offering = course && cohort
      ? offerings.find((item) => item.courseId === course.id && item.cohortId === cohort.id)
      : undefined;
    if (course && cohort && !offering) errors.push(`Course offering is not configured for this period: ${course.code} / ${cohort.code}`);

    return {
      resolvedCourseId: course?.id ?? null,
      resolvedVenueId: venue?.id ?? null,
      resolvedLecturerId: lecturer?.id ?? null,
      resolvedCohortId: cohort?.id ?? null,
      resolvedOfferingId: offering?.id ?? null,
      normalizedDay: dayText,
      normalizedStartTime: time?.startTime ?? null,
      normalizedEndTime: time?.endTime ?? null,
      validationStatus: errors.length > 0 ? StagedValidationStatus.INVALID : StagedValidationStatus.VALID,
      errors,
      conflicts: [] as unknown[],
    };
  };
}

function asSlot(row: {
  id: string;
  normalizedDay: string | null;
  normalizedStartTime: string | null;
  normalizedEndTime: string | null;
  resolvedVenueId: string | null;
  resolvedLecturerId: string | null;
  resolvedOfferingId: string | null;
  resolvedCohortId: string | null;
}): SlotLike | null {
  if (!row.normalizedDay || !row.normalizedStartTime || !row.normalizedEndTime || !row.resolvedVenueId || !row.resolvedLecturerId || !row.resolvedOfferingId || !row.resolvedCohortId) return null;
  return {
    id: row.id,
    day: row.normalizedDay,
    startTime: row.normalizedStartTime,
    endTime: row.normalizedEndTime,
    venueId: row.resolvedVenueId,
    lecturerId: row.resolvedLecturerId,
    offeringId: row.resolvedOfferingId,
    cohortId: row.resolvedCohortId,
  };
}

export async function createImport(
  actor: AuthenticatedUser,
  input: { periodId: string; fileName: string; mimeType: string; contents: Uint8Array },
) {
  if (input.contents.byteLength > MAX_IMPORT_BYTES) throw new AppError("IMPORT_TOO_LARGE", "Import files must be 10 MB or smaller", 413);
  const safeName = basename(input.fileName).replace(/[\u0000-\u001f]/g, "").slice(0, 255);
  if (!safeName) throw new AppError("INVALID_FILE_NAME", "A valid file name is required", 400);
  const rows = await parseTimetableFile(safeName, input.contents);
  if (rows.length === 0) throw new AppError("EMPTY_IMPORT", "The file contains no timetable rows", 400);
  const checksum = createHash("sha256").update(input.contents).digest("hex");
  const period = await db.academicPeriod.findUnique({ where: { id: input.periodId }, select: { id: true } });
  if (!period) throw new AppError("ACADEMIC_PERIOD_NOT_FOUND", "Academic period was not found", 404);
  const duplicate = await db.importJob.findUnique({ where: { periodId_checksum: { periodId: input.periodId, checksum } }, select: { id: true } });
  if (duplicate) throw new AppError("DUPLICATE_IMPORT", "This file has already been imported for the selected academic period", 409);

  const extension = safeName.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
  const storageKey = await fileStorage.put(`imports/${randomUUID()}.${extension}`, input.contents);
  try {
    return await db.$transaction(async (transaction) => {
      const job = await transaction.importJob.create({
        data: {
          fileName: safeName,
          fileSize: input.contents.byteLength,
          mimeType: input.mimeType || (extension === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
          createdById: actor.id,
          periodId: input.periodId,
          status: ImportStatus.PARSED,
          totalRows: rows.length,
          checksum,
          storageKey,
        },
      });
      await transaction.stagedTimetableEntry.createMany({
        data: rows.map((row) => ({ jobId: job.id, ...row })),
      });
      await transaction.auditLog.create({
        data: {
          actorId: actor.id,
          action: "IMPORT_UPLOADED",
          entityType: "ImportJob",
          entityId: job.id,
          metadata: { fileName: safeName, recordCount: rows.length, checksum },
        },
      });
      return job;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    await fileStorage.delete(storageKey);
    throw parseError(error);
  }
}

export async function listImports(input: ImportListInput) {
  const rows = await db.importJob.findMany({
    where: input.status ? { status: input.status } : {},
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
  return cursorPage(rows, input.limit);
}

export async function getImport(jobId: string) {
  const job = await db.importJob.findUnique({
    where: { id: jobId },
    include: { stagedEntries: { orderBy: { rawRowIndex: "asc" } } },
  });
  if (!job) throw new AppError("NOT_FOUND", "Import job not found", 404);
  return job;
}

export async function correctImportRow(jobId: string, rowId: string, input: ImportRowCorrection) {
  return db.$transaction(async (transaction) => {
    const job = await transaction.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError("NOT_FOUND", "Import job not found", 404);
    assertImportMutable(job.status);
    assertExpectedVersion(job.version, input.expectedVersion);
    const row = await transaction.stagedTimetableEntry.findFirst({ where: { id: rowId, jobId } });
    if (!row) throw new AppError("NOT_FOUND", "Staged row not found", 404);

    const { expectedVersion, ...correction } = input;
    const update = await transaction.importJob.updateMany({
      where: { id: jobId, version: expectedVersion, status: { notIn: [ImportStatus.PUBLISHED, ImportStatus.DISCARDED] } },
      data: { version: { increment: 1 }, status: ImportStatus.PARSED },
    });
    if (update.count !== 1) throw new AppError("IMPORT_VERSION_CONFLICT", "Import changed since it was loaded; refresh and retry", 409);

    return transaction.stagedTimetableEntry.update({
      where: { id: rowId },
      data: {
        ...(correction.rawCourseCode !== undefined ? { rawCourseCode: correction.rawCourseCode } : {}),
        ...(correction.rawCourseTitle !== undefined ? { rawCourseTitle: correction.rawCourseTitle } : {}),
        ...(correction.rawVenue !== undefined ? { rawVenue: correction.rawVenue } : {}),
        ...(correction.rawDay !== undefined ? { rawDay: correction.rawDay } : {}),
        ...(correction.rawTime !== undefined ? { rawTime: correction.rawTime } : {}),
        ...(correction.rawLecturer !== undefined ? { rawLecturer: correction.rawLecturer } : {}),
        ...(correction.rawCohort !== undefined ? { rawCohort: correction.rawCohort } : {}),
        resolvedCourseId: null,
        resolvedVenueId: null,
        resolvedLecturerId: null,
        resolvedCohortId: null,
        resolvedOfferingId: null,
        normalizedDay: null,
        normalizedStartTime: null,
        normalizedEndTime: null,
        validationStatus: StagedValidationStatus.PENDING,
        errors: [],
        conflicts: [],
      },
    });
  });
}

export async function validateImport(jobId: string, expectedVersion: number) {
  return db.$transaction(async (transaction) => {
    const job = await transaction.importJob.findUnique({
      where: { id: jobId },
      include: { stagedEntries: { orderBy: { rawRowIndex: "asc" } } },
    });
    if (!job) throw new AppError("NOT_FOUND", "Import job not found", 404);
    assertImportMutable(job.status);
    assertExpectedVersion(job.version, expectedVersion);

    const resolve = await makeResolver(transaction, job.periodId);
    const resolvedRows = job.stagedEntries.map((row) => ({ row, result: resolve(row) }));
    const existing = await transaction.timetableEntry.findMany({
      where: { periodId: job.periodId, status: "ACTIVE" },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        venueId: true,
        lecturerId: true,
        offeringId: true,
        offering: { select: { cohortId: true } },
      },
    });
    const currentSlots: SlotLike[] = existing.map((slot) => ({ ...slot, cohortId: slot.offering.cohortId }));
    const stagedSlots = resolvedRows.flatMap(({ row, result }) => {
      const slot = asSlot({ id: row.id, ...result });
      return slot ? [slot] : [];
    });
    const conflicts = detectSlotConflicts([...currentSlots, ...stagedSlots]);
    let validRows = 0;
    let conflictRows = 0;

    for (const { row, result } of resolvedRows) {
      const rowConflicts = conflicts.filter((conflict) => conflict.sourceId === row.id || conflict.targetId === row.id);
      const validationStatus = rowConflicts.length > 0 ? StagedValidationStatus.CONFLICT : result.validationStatus;
      if (validationStatus === StagedValidationStatus.VALID) validRows += 1;
      if (validationStatus === StagedValidationStatus.CONFLICT) conflictRows += 1;
      await transaction.stagedTimetableEntry.update({
        where: { id: row.id },
        data: {
          ...result,
          validationStatus,
          conflicts: rowConflicts,
        },
      });
    }

    const updated = await transaction.importJob.updateMany({
      where: { id: jobId, version: expectedVersion, status: { notIn: [ImportStatus.PUBLISHED, ImportStatus.DISCARDED] } },
      data: { version: { increment: 1 }, status: ImportStatus.VALIDATED, validRows, conflictRows, totalRows: job.stagedEntries.length },
    });
    if (updated.count !== 1) throw new AppError("IMPORT_VERSION_CONFLICT", "Import changed while validation was running", 409);
    return transaction.importJob.findUniqueOrThrow({ where: { id: jobId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function publishImport(jobId: string, actor: AuthenticatedUser, expectedVersion: number) {
  return db.$transaction(async (transaction) => {
    const job = await transaction.importJob.findUnique({
      where: { id: jobId },
      include: { stagedEntries: { orderBy: { rawRowIndex: "asc" } } },
    });
    if (!job) throw new AppError("NOT_FOUND", "Import job not found", 404);
    if (job.status !== ImportStatus.VALIDATED) throw new AppError("IMPORT_NOT_VALIDATED", "Validate this import before publishing", 409);
    assertExpectedVersion(job.version, expectedVersion);
    if (job.stagedEntries.length === 0 || job.stagedEntries.some((row) => row.validationStatus !== StagedValidationStatus.VALID)) {
      throw new AppError("IMPORT_HAS_INVALID_ROWS", "Every staged row must be valid and conflict-free before publishing", 409);
    }

    const candidateSlots = job.stagedEntries.flatMap((row) => {
      const slot = asSlot(row);
      return slot ? [slot] : [];
    });
    if (candidateSlots.length !== job.stagedEntries.length || detectSlotConflicts(candidateSlots).length > 0) {
      throw new AppError("IMPORT_CONFLICT", "The staged timetable contains conflicts; validate and correct it before publishing", 409);
    }

    await transaction.timetableEntry.updateMany({
      where: { periodId: job.periodId, status: "ACTIVE" },
      data: { status: "ARCHIVED", archivedAt: new Date(), archiveReason: `Replaced by import ${job.id}` },
    });
    await transaction.timetableEntry.createMany({
      data: job.stagedEntries.map((row) => ({
        offeringId: row.resolvedOfferingId!,
        periodId: job.periodId,
        lecturerId: row.resolvedLecturerId!,
        venueId: row.resolvedVenueId!,
        day: row.normalizedDay!,
        startTime: row.normalizedStartTime!,
        endTime: row.normalizedEndTime!,
      })),
    });

    const cohortIds = [...new Set(job.stagedEntries.flatMap((row) => row.resolvedCohortId ? [row.resolvedCohortId] : []))];
    const recipients = await transaction.user.findMany({
      where: { cohortId: { in: cohortIds }, role: Role.STUDENT, status: "ACTIVE" },
      select: { id: true },
    });
    await createNotificationBatch(transaction, recipients.map(({ id }) => ({
      recipientId: id,
      title: "Timetable published",
      message: `A new timetable was published for your cohort from ${job.fileName}.`,
      type: "ANNOUNCEMENT" as const,
    })));

    const updated = await transaction.importJob.updateMany({
      where: { id: jobId, version: expectedVersion, status: ImportStatus.VALIDATED },
      data: { status: ImportStatus.PUBLISHED, version: { increment: 1 }, publishedAt: new Date() },
    });
    if (updated.count !== 1) throw new AppError("IMPORT_VERSION_CONFLICT", "Import changed while publishing", 409);
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "IMPORT_PUBLISHED",
        entityType: "ImportJob",
        entityId: job.id,
        metadata: { fileName: job.fileName, recordCount: job.stagedEntries.length, publishedAt: new Date().toISOString() },
      },
    });
    return { id: job.id, status: ImportStatus.PUBLISHED, publishedCount: job.stagedEntries.length, notificationCount: recipients.length };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function discardImport(jobId: string, actor: AuthenticatedUser, expectedVersion: number) {
  const discarded = await db.$transaction(async (transaction) => {
    const job = await transaction.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError("NOT_FOUND", "Import job not found", 404);
    assertImportMutable(job.status);
    assertExpectedVersion(job.version, expectedVersion);
    const updated = await transaction.importJob.updateMany({
      where: { id: jobId, version: expectedVersion, status: { notIn: [ImportStatus.PUBLISHED, ImportStatus.DISCARDED] } },
      data: { status: ImportStatus.DISCARDED, version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new AppError("IMPORT_VERSION_CONFLICT", "Import changed while discarding", 409);
    await transaction.auditLog.create({
      data: { actorId: actor.id, action: "IMPORT_DISCARDED", entityType: "ImportJob", entityId: jobId, metadata: { fileName: job.fileName } },
    });
    return { id: job.id, status: ImportStatus.DISCARDED, storageKey: job.storageKey };
  });
  await fileStorage.delete(discarded.storageKey);
  return { id: discarded.id, status: discarded.status };
}