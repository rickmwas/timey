export interface FileStorage {
  put(key: string, contents: Uint8Array): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}