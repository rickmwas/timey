import { Buffer } from "node:buffer";
import { del, get, put } from "@vercel/blob";
import { AppError } from "@/server/errors/app-error";
import type { FileStorage } from "@/server/storage/file-storage";

export class VercelBlobStorage implements FileStorage {
  private getToken(): string {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new AppError(
        "STORAGE_NOT_CONFIGURED",
        "Vercel Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
        503,
      );
    }
    return token;
  }

  async put(key: string, contents: Uint8Array): Promise<string> {
    const blob = await put(key, Buffer.from(contents), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      token: this.getToken(),
    });
    return blob.pathname;
  }

  async get(key: string): Promise<Uint8Array> {
    const blob = await get(key, {
      access: "private",
      token: this.getToken(),
    });
    if (!blob) {
      throw new AppError("STORAGE_NOT_FOUND", "Stored import file was not found", 404);
    }
    if (blob.statusCode !== 200) {
      throw new AppError("STORAGE_READ_FAILED", "Stored import file could not be read", 502);
    }
    return new Uint8Array(await new Response(blob.stream).arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await del(key, { token: this.getToken() });
  }
}
