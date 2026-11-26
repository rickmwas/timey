import type { FileStorage } from "@/server/storage/file-storage";
import { localFileStorage } from "@/server/storage/local-file-storage";
import { VercelBlobStorage } from "@/server/storage/vercel-blob-storage";

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1" &&
    (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production");
}

export const fileStorage: FileStorage = isVercelDeployment()
  ? new VercelBlobStorage()
  : localFileStorage;
