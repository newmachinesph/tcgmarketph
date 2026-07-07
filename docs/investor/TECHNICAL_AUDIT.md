# TCGMarket PH — Technical Due-Diligence Audit

*Audit date: July 2026 · Scope: full repository at commit `938c4b7` on the master lineage · Method: static review of source, schema, configuration, tests, and git history. Every finding cites a file path verifiable in this repository.*

---

## 1. Scorecard

| Category | Rating | Summary |
|---|---|---|
| Architecture & stack | **Strong** | Modern serverless stack, well-chosen PH-localized vendors, clean separation |
| Feature completeness | **Strong (for MVP)** | All advertised flows implemented end-to-end; one deferred TODO |
| Security fundamentals | **Good** | Validation, rate limiting, verified webhooks, hardened headers; several config gaps to close before launch |
| Code quality | **Good** | Strict TypeScript, pervasive Zod validation, disciplined commit history; no unit-test layer |
| Testing | **Fair** | 92 Playwright end-to-end tests; no unit tests, tests not wired into CI |
| Operations & observability | **Weak** | No error tracking, no CI/CD, no runbook — the main pre-launch gap |
| Documentation | **Weak → improving** | README was boilerplate; this package is the first documentation |
| Operating track record | **None yet** | Codebase built over ~4 days in June 2026 (50 commits); pre-launch |

**Bottom line:** this is a genuinely functional, security-conscious MVP — not a prototype. The gaps are the *predictable* ones for a pre-launch solo build (CI, observability, docs), all cheap to close relative to what is already built. A prioritized remediation plan is in §7.

## 2. Architecture & stack

Next.js App Router monolith with route-level separation of public, authenticated, auth, and API surfaces (`src/app/(public)`, `(app)`, `(auth)`, `api`), deployed serverless.

| Layer | Technology | Evidence |
|---|---|---|
| Framework | Next.js 16.2.9, React 19.2.4, TypeScript 5 (`strict: true`) | `package.json`, `tsconfig.json` |
| Database | PostgreSQL (Neon serverless) via Drizzle ORM; 7 tracked migrations | `src/lib/db.ts`, `drizzle/`, `drizzle.config.ts` |
| Auth | Better Auth 1.6 — email/password + Google OAuth, Drizzle adapter | `src/lib/auth.ts` |
| Payments | PayMongo Payment Links (QR Ph → GCash/Maya/banks) | `src/lib/paymongo.ts`, `src/app/api/billing/subscribe/route.ts` |
| KYC | Didit identity verification with signed webhooks | `src/app/api/kyc/*`, `src/app/api/webhooks/didit/route.ts` |
| SMS OTP | Semaphore (PH provider) | `src/lib/sms.ts`, `src/app/api/otp/*` |
| Realtime | Ably — chat, live auction bids | `src/lib/ably.ts` |
| Cache / flags / rate limits | Upstash Redis + `@upstash/ratelimit` | `src/lib/redis.ts`, `src/lib/rate-limit.ts`, `src/lib/feature-flags.ts` |
| Background jobs | Inngest — 7 scheduled functions | `src/lib/inngest/functions/` |
| Uploads / email / push | UploadThing · Nodemailer + React Email · Web Push (VAPID) | `src/lib/uploadthing.ts`, `src/lib/mailer.ts`, `src/emails/`, `src/lib/webpush.ts` |
| Analytics | Google Analytics 4 | `src/app/layout.tsx` |

**Assessment:** each third-party dependency sits behind a thin adapter in `src/lib/`, so no vendor is load-bearing beyond its API surface. The stack is entirely usage-priced (serverless), so idle burn is near zero — appropriate for pre-launch.

### Data model

12 schema modules in `src/db/schema/` around two hubs: `user` and a de-duplicated `card_catalog` (with trigram search index and scheduled market-price refresh). Commerce chain: `listings` (fixed-price or auction, with photos, bids, views, 30-day expiry) → `offers` (accept/decline/counter, 48h expiry) → `transactions` (pending → agreed → completed / cancelled / no_show / disputed, with `meetup_proposals`) → `ratings` (one per party per deal). Supporting: collections/folders/wishlist, wanted listings, conversations/messages, notifications, saved searches/price alerts, blocks, reports + `admin_actions` audit log. The model is normalized, indexed for its query patterns, and migration history is clean (`drizzle/meta/_journal.json`).

## 3. Feature completeness

Inventory: **45 pages, 75 API route handlers, 243 TS/TSX source files, 7 background jobs.**

| Domain | Status | Evidence |
|---|---|---|
| Marketplace: browse, search, listing detail, seller storefronts | ✅ Complete | `src/app/(public)/marketplace`, `listings/[id]`, `sellers/[id]` |
| Listings: create, edit, bulk create, CSV import, analytics | ✅ Complete | `src/app/(app)/listings/*` |
| Auctions: live bidding, reserve, increments, scheduled close | ✅ Complete | `src/db/schema/listings.ts`, `api/bids`, `inngest/functions/close-auctions.ts` |
| Offers / counter-offers with expiry | ✅ Complete | `src/app/api/offers/*`, `inngest/functions/expire-offers.ts` |
| Transactions & meetup negotiation, disputes | ✅ Complete | `src/app/api/transactions/*`, `src/db/schema/transactions.ts` |
| Real-time chat | ✅ Complete | `src/app/(app)/messages`, `api/conversations/*` |
| Trust: OTP, KYC, ratings, blocks, reports | ✅ Complete | §2 table |
| Collection / wishlist / want-to-buy with auto-matching | ✅ Complete | `src/app/api/collection/*`, `wanted/*`, matcher jobs in `inngest/functions/` |
| Admin console: users, bans, takedowns, reports, disputes, feature flags, metrics | ✅ Complete | `src/app/(app)/admin/*`, `src/app/api/admin/*` |
| Monetization: tier enforcement + PayMongo subscription | ✅ Complete | `src/lib/constants/tiers.ts`, `src/lib/capabilities.ts`, `api/billing/subscribe` |
| Online payments per transaction | 🚧 Built, feature-flagged off | `src/lib/feature-flags.ts` (`online_payments`) |
| KYC gate for listings > ₱5,000 | 📋 Deferred (sole TODO in codebase) | `src/app/api/listings/route.ts:110` |
| PWA (installable, service worker, push) | ✅ Complete | `public/sw.js`, `src/lib/webpush.ts` |

No stubbed features, `NotImplemented` throws, or `@ts-ignore` suppressions were found. "Coming soon" copy on public pages refers to roadmap items (new games, mobile apps), not broken features.

## 4. Security posture

### Strengths

- **No secrets committed.** All credentials read from `process.env`; `.env*` git-ignored. The only committed passwords are E2E/seed fixtures for `*@test.com` accounts (`e2e/helpers/auth.ts`, `scripts/seed-sim.ts`) — see finding S-5.
- **Input validation is pervasive:** Zod schemas across 44 files (119 usages), centralized in `src/lib/validations/`.
- **Rate limiting is per-action:** sliding-window Upstash limiters for auth, password reset, OTP, search, bids, messages, transactions, offers, listings, KYC, plus a global external-API quota (`src/lib/rate-limit.ts`) — see finding S-2 for the caveat.
- **Webhook signatures verified with constant-time comparison** (`timingSafeEqual`) for both PayMongo (`src/lib/paymongo.ts`) and Didit (`src/app/api/webhooks/didit/route.ts`).
- **Hardened HTTP headers** in `next.config.ts`: full CSP, HSTS with preload, `X-Frame-Options`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, `frame-ancestors 'none'`.
- **Sound auth boundaries:** middleware (`src/proxy.ts`) is explicitly a UI-redirect layer only; every API route independently enforces `auth.api.getSession()`. Admin routes additionally check the `isAdmin` flag; admin actions are written to an audit log (`src/db/schema/reports.ts`).

### Findings (disclosed gaps)

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| S-1 | High | **Email verification is disabled** (`requireEmailVerification: false`) — accounts can be created on unowned addresses | `src/lib/auth.ts` |
| S-2 | High | **Rate limiting fails open:** limiters silently no-op when Upstash env vars are absent — a misconfigured deploy ships with no rate limits and no warning | `src/lib/rate-limit.ts` |
| S-3 | Medium | **Seed script is destructive and creates a known-password admin** (`admin@tcgmarket.ph`); nothing prevents it running against a production `DATABASE_URL` | `scripts/seed-sim.ts` |
| S-4 | Low | Didit webhook reads header `x-signature` with fallback to typo `x-signatur` — harmless but sloppy; signature check itself is sound | `src/app/api/webhooks/didit/route.ts` |
| S-5 | Low | E2E fixture credentials committed (test accounts only; not a production leak) | `e2e/helpers/auth.ts` |
| S-6 | Low | `images.remotePatterns` allows any HTTPS hostname (`**`) — intentional for card CDNs, but wider than necessary | `next.config.ts` |

## 5. Quality & testing

- **Type safety:** TypeScript `strict: true`; build does **not** bypass type or lint errors (no `ignoreBuildErrors` in `next.config.ts`). No `@ts-ignore`/`@ts-nocheck` anywhere; ~4 narrowly-scoped `eslint-disable` comments.
- **E2E tests: 92 test blocks across 8 Playwright suites** (`e2e/`): API auth-guards (9), authenticated API (20), public API (22), public pages (22), mobile UX (15), listing detail (11), marketplace interactions (11), authenticated pages (10), plus an auth setup project.
- **Gaps:** no unit-test framework (no Vitest/Jest), no coverage measurement, no `test` script in `package.json` (E2E must be invoked directly), and — most significantly — **no CI/CD**: `.github/` does not exist, so nothing runs lint, typecheck, or tests on push.
- **Process signals:** 50 conventional commits (`feat:`/`fix:`/`chore:`) referencing an explicit Phase 1–7 build plan — disciplined for a compressed timeline, but the entire history spans 2026-06-26 → 06-29. There is no production operating history.

## 6. Operational readiness

| Area | State |
|---|---|
| Error handling | ✅ Consistent try/catch with structured JSON errors across API routes |
| DB migrations | ✅ 7 tracked Drizzle migrations with journal + snapshots; runner scripts (`scripts/migrate.mjs`) |
| Background jobs | ✅ 7 Inngest functions: auction close, listing/offer expiry, price refresh, 3 matchers |
| Observability | ❌ **None** — no Sentry/Datadog/OTel; 58 `console.*` calls are the only logging. Production errors would be invisible |
| CI/CD | ❌ None |
| Environment docs | ❌ No `.env.example` — the ~26-variable env surface must be reverse-engineered from code |
| License / legal | ❌ No LICENSE file; no privacy policy / terms-of-service surfaced in repo (required pre-launch for KYC data handling under the PH Data Privacy Act) |
| Backups / DR | ❓ Delegated to Neon (managed Postgres); no documented restore procedure |

## 7. Risk register & remediation roadmap

Prioritized so that every gap above converts into a scoped task. Effort assumes one engineer.

### P0 — before public launch (~1 week total)

| Task | Addresses | Effort |
|---|---|---|
| Add error tracking (e.g., Sentry) + alerting | Observability gap | 0.5–1 d |
| Add CI (GitHub Actions): lint + typecheck + build + E2E on push | No CI | 0.5–1 d |
| Enable email verification in Better Auth | S-1 | 0.5 d |
| Make rate limiting fail **closed** in production (refuse to boot without Redis, or hard-warn) | S-2 | 0.5 d |
| Guard seed script against non-local `DATABASE_URL`; randomize seeded admin password | S-3 | 0.5 d |
| Publish privacy policy & ToS (KYC/PII handling — PH Data Privacy Act) | Legal | external |

### P1 — first month post-launch

| Task | Addresses | Effort |
|---|---|---|
| `.env.example` with all ~26 documented variables | Onboarding | 0.5 d |
| Unit-test layer (Vitest) for pricing/tier/validation logic; wire `npm test` | Testing gap | 2–3 d |
| Implement the KYC gate for listings > ₱5,000 (scaffolded TODO) | Trust roadmap | 1–2 d |
| Fix stale `/upgrade` SEO metadata ("500 listings / 10 photos" vs actual 50/3) | Marketing accuracy | 0.5 h |
| Fix Didit header-name typo fallback | S-4 | 0.5 h |
| Add LICENSE; document backup/restore runbook | Legal / ops | 0.5 d |

### P2 — as usage grows

| Task | Addresses |
|---|---|
| Restrict `images.remotePatterns` to known card CDNs | S-6 |
| Structured logging + request tracing | Observability depth |
| Load testing on auction close + bid paths | Scale readiness |
| Second engineer / code-review process | Bus factor |

## 8. Auditor's opinion

For a pre-launch marketplace MVP, this codebase is **above the bar**: real payments, KYC, realtime, and moderation are implemented and wired to production-grade vendors, with security fundamentals (validation, rate limiting, signed webhooks, hardened headers, no leaked secrets) that many funded seed-stage products lack. The deficiencies — no CI, no observability, no unit tests, no docs, no track record — are the standard debts of a days-old solo build, they are all itemized above, and none is architectural. Total estimated cost to clear the P0 list is roughly **one engineer-week**.

The material diligence risks are therefore **not technical**: they are the empty-marketplace cold-start problem and the single-maintainer bus factor, both addressed in the business plan's risk section.

---

*This audit was generated by automated + manual static review of the repository. It does not include penetration testing, dependency-CVE scanning, or load testing; those are recommended before switching on online payments.*
