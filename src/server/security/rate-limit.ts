type Counter = { count: number; resetAt: number };

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number };
  reset(key: string): void;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, Counter>();

  consume(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.counters.get(key);
    if (!current || current.resetAt <= now) {
      this.counters.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }
    current.count += 1;
    return {
      allowed: current.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  reset(key: string): void {
    this.counters.delete(key);
  }
}

export const loginRateLimiter: RateLimiter = new InMemoryRateLimiter();