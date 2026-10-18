import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Duration = `${number} s` | `${number} m` | `${number} h` | `${number} d`;

function makeRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function hasRedis() {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Returns null when Upstash env vars are not set (dev without Redis).
function makeRatelimiter(requests: number, window: Duration) {
  if (!hasRedis()) return null;
  return new Ratelimit({
    redis: makeRedis(),
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

// 30 card searches per minute per IP — prevents scraping the search endpoint
export const searchRatelimit = makeRatelimiter(30, "60 s");

// 15 bids per minute per user — prevents rapid-fire bot bidding
export const bidRatelimit = makeRatelimiter(15, "60 s");

// 30 messages per minute per user
export const messageRatelimit = makeRatelimiter(30, "60 s");

// 10 buy requests per hour per user — prevents spam transaction creation
export const transactionRatelimit = makeRatelimiter(10, "60 m");

// 20 offers per hour per user — prevents offer flooding
export const offerRatelimit = makeRatelimiter(20, "60 m");

// 5 new listings per 10 minutes per seller
export const listingRatelimit = makeRatelimiter(5, "10 m");

// 3 KYC session starts per hour per user — Didit API calls cost money
export const kycRatelimit = makeRatelimiter(3, "60 m");

// Protects our 100 req/day TCG API quota. Fixed daily window mirrors tcgapi.dev's
// reset schedule. Key must always be "global" (shared across all users).
export const tcgApiRatelimit = hasRedis()
  ? new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.fixedWindow(90, "1 d"),
      analytics: true,
      prefix: "tcg-api",
    })
  : null;
