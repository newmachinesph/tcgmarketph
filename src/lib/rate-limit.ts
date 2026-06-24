import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Returns null when Upstash env vars are not set (dev without Redis).
function makeRatelimiter(requests: number, window: `${number} s` | `${number} m`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

// 10 auth attempts per minute per IP
export const authRatelimit = makeRatelimiter(10, "60 s");

// 5 password-reset requests per hour per IP
export const resetRatelimit = makeRatelimiter(5, "60 m");

// 3 OTP sends per 10 minutes per user
export const otpRatelimit = makeRatelimiter(3, "10 m");
