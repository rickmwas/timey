const sensitiveKeys = /password|token|secret|cookie|authorization|filecontent|rawrow/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sensitiveKeys.test(key) ? "[REDACTED]" : redact(entry)]),
    );
  }
  return value;
}