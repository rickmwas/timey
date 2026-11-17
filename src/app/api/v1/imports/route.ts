import { ImportStatus, Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { ImportListQuerySchema } from "@/server/schemas/imports";
import { assertSameOrigin } from "@/server/security/csrf";
import { fileStorage, isVercelDeployment } from "@/server/storage/file-storage-provider";
import { z } from "zod";
import { createImport, listImports, toImportResponse } from "@/server/services/imports";

const StoredUploadSchema = z.object({
  periodId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(255),
  storageKey: z.string().min(1),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  requirePermission(actor, "import:manage");
  const query = ImportListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const page = await listImports(query);
  return successResponse({ ...page, items: page.items.map(toImportResponse) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "import:manage");

  if (request.headers.get("content-type")?.includes("application/json")) {
    if (!isVercelDeployment()) {
      throw new AppError("INVALID_UPLOAD_METHOD", "Direct uploads are only available on Vercel", 400);
    }
    const parsed = StoredUploadSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("INVALID_IMPORT_UPLOAD", "A valid uploaded file is required", 400);
    const { periodId, fileName, mimeType, storageKey } = parsed.data;
    const stagingPrefix = `imports/${actor.id}/staging/`;
    const extension = fileName.toLowerCase().split(".").at(-1);
    const stagingName = storageKey.startsWith(stagingPrefix)
      ? storageKey.slice(stagingPrefix.length)
      : "";
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(csv|xlsx)$/i.test(stagingName) ||
      !["csv", "xlsx"].includes(extension ?? "") ||
      !stagingName.toLowerCase().endsWith(`.${extension}`)
    ) {
      throw new AppError("INVALID_STORAGE_KEY", "The uploaded file is not valid for this account", 400);
    }
    const allowedContentTypes = extension === "xlsx"
      ? ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
      : ["text/csv", "application/csv", "text/plain", "application/octet-stream"];
    if (mimeType && !allowedContentTypes.includes(mimeType)) {
      throw new AppError("IMPORT_FILE_INVALID", "File content type does not match its extension", 400);
    }

    const contents = await fileStorage.get(storageKey);
    let job: Awaited<ReturnType<typeof createImport>>;
    try {
      job = await createImport(actor, { periodId, fileName, mimeType, contents });
    } catch (error) {
      try {
        await fileStorage.delete(storageKey);
      } catch (cleanupError) {
        console.error("Failed to remove a temporary timetable upload", cleanupError);
      }
      throw error;
    }
    try {
      await fileStorage.delete(storageKey);
    } catch (cleanupError) {
      console.error("Failed to remove a temporary timetable upload", cleanupError);
    }
    return successResponse({ job: toImportResponse(job) }, 201);
  }

  const form = await request.formData();
  const periodId = form.get("periodId");
  const file = form.get("file");
  if (typeof periodId !== "string" || !zodUuid(periodId)) throw new AppError("INVALID_PERIOD_ID", "A valid periodId is required", 400);
  if (!(file instanceof File)) throw new AppError("FILE_REQUIRED", "Upload a CSV or XLSX file", 400);
  const extension = file.name.toLowerCase().split(".").at(-1);
  if (extension !== "csv" && extension !== "xlsx") throw new AppError("UNSUPPORTED_IMPORT_TYPE", "Only CSV and XLSX files are supported", 415);
  if (file.size === 0) throw new AppError("EMPTY_IMPORT", "The uploaded file is empty", 400);
  if (file.size > 10 * 1024 * 1024) throw new AppError("IMPORT_TOO_LARGE", "Import files must be 10 MB or smaller", 413);
  if (file.type && extension === "xlsx" && file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    throw new AppError("IMPORT_FILE_INVALID", "XLSX content type does not match its extension", 400);
  }
  if (file.type && extension === "csv" && !["text/csv", "application/csv", "text/plain", "application/octet-stream"].includes(file.type)) {
    throw new AppError("IMPORT_FILE_INVALID", "CSV content type does not match its extension", 400);
  }
  const job = await createImport(actor, {
    periodId,
    fileName: file.name,
    mimeType: file.type,
    contents: new Uint8Array(await file.arrayBuffer()),
  });
  return successResponse({ job: toImportResponse(job) }, 201);
});

function zodUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}