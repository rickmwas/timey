import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import { del, get, put } from "@vercel/blob";
import { AppError } from "@/server/errors/app-error";
import { VercelBlobStorage } from "@/server/storage/vercel-blob-storage";

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

describe("VercelBlobStorage", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
  const storage = new VercelBlobStorage();

  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  });

  it("writes private blobs without changing their storage key", async () => {
    vi.mocked(put).mockResolvedValue({
      pathname: "imports/timetable.csv",
      url: "https://private.blob.vercel-storage.com/imports/timetable.csv",
      downloadUrl: "https://private.blob.vercel-storage.com/imports/timetable.csv",
      contentType: "text/csv",
      contentDisposition: "attachment",
      etag: "etag",
    });

    await expect(storage.put("imports/timetable.csv", new Uint8Array([1, 2]))).resolves.toBe(
      "imports/timetable.csv",
    );
    expect(put).toHaveBeenCalledWith(
      "imports/timetable.csv",
      Buffer.from([1, 2]),
      expect.objectContaining({
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        token: "test-token",
      }),
    );
  });

  it("reads private blobs and returns their bytes", async () => {
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([7, 8, 9]));
          controller.close();
        },
      }),
      headers: new Headers(),
      blob: {
        url: "https://private.blob.vercel-storage.com/imports/timetable.csv",
        downloadUrl: "https://private.blob.vercel-storage.com/imports/timetable.csv",
        pathname: "imports/timetable.csv",
        contentDisposition: "attachment",
        cacheControl: "private",
        uploadedAt: new Date(),
        etag: "etag",
        contentType: "text/csv",
        size: 3,
      },
    });

    await expect(storage.get("imports/timetable.csv")).resolves.toEqual(new Uint8Array([7, 8, 9]));
    expect(get).toHaveBeenCalledWith(
      "imports/timetable.csv",
      expect.objectContaining({ access: "private", token: "test-token" }),
    );
  });

  it("reports missing Blob configuration instead of falling back to local disk", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    await expect(storage.put("imports/timetable.csv", new Uint8Array([1]))).rejects.toMatchObject({
      code: "STORAGE_NOT_CONFIGURED",
      statusCode: 503,
    } satisfies Partial<AppError>);
    expect(put).not.toHaveBeenCalled();
  });

  it("deletes private blobs by their storage key", async () => {
    vi.mocked(del).mockResolvedValue();

    await storage.delete("imports/timetable.csv");
    expect(del).toHaveBeenCalledWith("imports/timetable.csv", { token: "test-token" });
  });
});
