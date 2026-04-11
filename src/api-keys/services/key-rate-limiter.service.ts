import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Simple in-memory per-key rate limiter.
 *
 * Tracks request counts in 1-minute sliding windows keyed by API key ID.
 * For production scale, swap the internal Map for Redis.
 */
@Injectable()
export class KeyRateLimiterService {
  private readonly windows = new Map<string, RateLimitEntry>();

  // Periodic cleanup interval (every 5 minutes)
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      5 * 60 * 1000,
    );
  }

  /**
   * Check if a key is within its rate limit.
   * Returns `true` if allowed, `false` if rate-limited.
   * Also increments the counter.
   */
  check(keyId: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const windowMs = 60_000;
    const entry = this.windows.get(keyId);

    if (!entry || now - entry.windowStart >= windowMs) {
      // New window
      this.windows.set(keyId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= limitPerMinute) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Returns the number of remaining requests in the current window.
   */
  remaining(keyId: string, limitPerMinute: number): number {
    const now = Date.now();
    const windowMs = 60_000;
    const entry = this.windows.get(keyId);

    if (!entry || now - entry.windowStart >= windowMs) {
      return limitPerMinute;
    }

    return Math.max(0, limitPerMinute - entry.count);
  }

  private cleanup() {
    const now = Date.now();
    const windowMs = 60_000;

    for (const [key, entry] of this.windows.entries()) {
      if (now - entry.windowStart >= windowMs * 2) {
        this.windows.delete(key);
      }
    }
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }
}
