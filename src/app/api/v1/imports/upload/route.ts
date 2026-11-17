import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { MAX_IMPORT_BYTES } from "@/server/services/import-parser";
import { assertSameOrigin } from "@/server/security/csrf";
import { isVercelDeployment } from "@/server/storage/file-storage-provider";

const UploadMetadataSchema = z.object({
  periodId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(255),
});

const csvTypes = ["text/csv", "application/csv", "text/plain", "application/octet-stream"];
const xlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  requirePermission(actor, "import:manage");
  const clientUpload = isVercelDeployment();
  if (clientUpload && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AppError(
      "STORAGE_NOT_CONFIGURED",
      "Vercel Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
      503,
    );
  }
  return successResponse({ clientUpload });
});

export async function POST(request: NextRequest): Promise<Response> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json(
      { error: { code: "STORAGE_NOT_CONFIGURED", message: "Vercel Blob storage is not configured." } },
      { status: 503 },
    );
  }

  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({
      token,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        assertSameOrigin(request);
        const actor = await requireUser(request);
        requirePermission(actor, "import:manage");

        let payloadValue: unknown;
        try {
          payloadValue = JSON.parse(clientPayload ?? "");
        } catch {
          throw new AppError("INVALID_IMPORT_UPLOAD", "Upload details are invalid", 400);
        }
        const parsed = UploadMetadataSchema.safeParse(payloadValue);
        if (!parsed.success) throw new AppError("INVALID_IMPORT_UPLOAD", "Upload details are invalid", 400);

        const stagingPrefix = `imports/${actor.id}/staging/`;
        const suffix = pathname.startsWith(stagingPrefix) ? pathname.slice(stagingPrefix.length) : "";
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(csv|xlsx)$/i.test(suffix)) {
          throw new AppError("INVALID_STORAGE_KEY", "The uploaded file path is invalid", 400);
        }

        const extension = parsed.data.fileName.toLowerCase().split(".").at(-1);
        const allowedContentTypes = extension === "xlsx" ? [xlsxType] : csvTypes;
        if (extension !== "xlsx" && extension !== "csv") {
          throw new AppError("UNSUPPORTED_IMPORT_TYPE", "Only CSV and XLSX files are supported", 415);
        }
        if (!pathname.toLowerCase().endsWith(`.${extension}`)) {
          throw new AppError("INVALID_STORAGE_KEY", "The uploaded file path does not match its file type", 400);
        }
        if (
          parsed.data.mimeType &&
          (extension === "xlsx"
            ? parsed.data.mimeType !== xlsxType
            : !csvTypes.includes(parsed.data.mimeType))
        ) {
          throw new AppError("IMPORT_FILE_INVALID", "File content type does not match its extension", 400);
        }

        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_IMPORT_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          ttlDays: 1,
          validUntil: Date.now() + 15 * 60 * 1000,
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("Vercel Blob upload authorization failed", error);
    return Response.json(
      { error: { code: "BLOB_UPLOAD_FAILED", message: "Could not authorize the file upload." } },
      { status: 500 },
    );
  }
}
