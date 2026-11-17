import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { env } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import type { FileStorage } from "@/server/storage/file-storage";

export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(directory = env.STORAGE_LOCAL_DIR) {
    this.root = resolve(directory);
  }

  private resolveKey(key: string): string {
    if (!key || isAbsolute(key)) throw new AppError("INVALID_STORAGE_KEY", "Storage key is invalid", 400);
    const destination = resolve(this.root, key);
    if (!destination.startsWith(`${this.root}${sep}`)) {
      throw new AppError("INVALID_STORAGE_KEY", "Storage key is invalid", 400);
    }
    return destination;
  }

  async put(key: string, contents: Uint8Array): Promise<void> {
    const destination = this.resolveKey(key);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, { flag: "wx", mode: 0o600 });
  }

  async get(key: string): Promise<Uint8Array> {
    try {
      return await readFile(this.resolveKey(key));
    } catch {
      throw new AppError("STORAGE_NOT_FOUND", "Stored import file was not found", 404);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export const localFileStorage: FileStorage = new LocalFileStorage();