export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export class RateLimiter {
  constructor(
    private kv: KVNamespace,
    private config: RateLimitConfig
  ) {}

  async checkLimit(ip: string, type: string): Promise<RateLimitResult> {
    const key = `rate:${type}:${ip}`;
    const current = parseInt(await this.kv.get(key) || '0', 10);

    if (current >= this.config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: this.config.maxRequests - current };
  }

  async increment(ip: string, type: string): Promise<void> {
    const key = `rate:${type}:${ip}`;
    const current = parseInt(await this.kv.get(key) || '0', 10);
    const ttl = Math.floor(this.config.windowMs / 1000);
    await this.kv.put(key, String(current + 1), { expirationTtl: ttl });
  }
}

// 設定値
export const RATE_LIMITS = {
  article: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  translate: { maxRequests: 100, windowMs: 60 * 60 * 1000 }
};
