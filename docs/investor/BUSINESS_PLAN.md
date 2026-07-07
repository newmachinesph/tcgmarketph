# TCGMarket PH — Business Plan

*Prepared July 2026 · Companion documents: [Executive Summary](./EXECUTIVE_SUMMARY.md) · [Technical Audit](./TECHNICAL_AUDIT.md)*

> **Sourcing legend** — every material claim is labeled: **[Code]** verifiable in this repository (file path given) · **[Cited]** external source, linked · **[Assumption]** illustrative founder estimate, to be replaced with actuals.

---

## 1. Company overview

**TCGMarket PH** ([tcgmarket.ph](https://tcgmarket.ph)) is a peer-to-peer marketplace for trading card games built specifically for the Philippines. It supports the transaction model Filipino collectors already use — **cash on meetup** — and wraps it in the trust infrastructure that Facebook groups and general marketplaces lack: identity verification, public reputation, live auctions, and moderated dispute handling.

- **Live categories:** Pokémon TCG, One Piece TCG **[Code:** `src/app/(public)/page.tsx`**]**
- **Announced next:** Yu-Gi-Oh!, Magic: The Gathering, Disney Lorcana, plus iOS/Android apps **[Code:** `src/app/(public)/about/AboutContent.tsx`**]**
- **Positioning:** "The safest cash-on-meetup marketplace for Pokémon, One Piece TCG, and more — made for Filipino card players. Zero fees."
- **Stage:** pre-launch, pre-revenue; feature-complete MVP (see §8)

## 2. The problem

Filipino TCG trading today happens in channels that were never designed for it:

1. **Facebook buy-and-sell groups** — the dominant venue. No seller verification, no persistent reputation, no search or price discovery, no recourse when a deal goes wrong.
2. **General marketplaces (Carousell, FB Marketplace, Shopee)** — cards are a rounding error in their catalogs; no card-catalog data, no condition/grading standards, no auction format, and the same fraud exposure.

The fraud context is severe and well documented:

- The Philippines had the **second-highest suspected digital-fraud rate globally in 2025**, with **13.4% of digital transactions flagged** as potentially fraudulent, and ~**72% of Filipino consumers targeted** by digital fraud vs. 53% globally. **[Cited:** [TransUnion H1 2026 via ScamWatchHQ](https://www.scamwatchhq.com/philippines-scams-2025-second-highest-global-fraud-rate-sparks-national-crisis-response/)**]**
- **Social media is now the #1 scam channel** in the Philippines, ahead of SMS and calls — precisely the Facebook buy-and-sell groups where card trading lives. **[Cited:** [GSMA](https://www.gsma.com/newsroom/press-release/rising-scam-exposure-in-the-philippines-underscores-need-for-cross-sector-action-warns-new-gsma-report/)**]**

For a category where a single graded card can trade for tens of thousands of pesos, this is an acute, unsolved trust problem.

## 3. The solution

TCGMarket PH does not fight the local behavior — it **formalizes it**. Filipinos prefer to meet in person and pay cash for cards; the platform makes that safe:

**Browse & Find → Connect → Meet & Trade**, with a trust layer at every step:

| Trust mechanism | Implementation **[Code]** |
|---|---|
| Phone verification | SMS OTP via Semaphore (PH provider) — `src/app/api/otp/*`, `src/lib/sms.ts` |
| Government-ID KYC | Didit identity verification — `src/app/api/kyc/*`, `src/app/api/webhooks/didit/` |
| Public reputation | 1–5 post-transaction ratings, one per party per deal — `src/db/schema/ratings.ts` |
| No-show accountability | No-show tracking on user profiles — `noShowCount` in `src/db/schema/auth.ts` |
| Moderation | Reports, user blocking, admin console with bans, listing takedowns, dispute resolution, and audit log — `src/app/(app)/admin/*`, `src/db/schema/reports.ts` |
| Safety guidance | Dedicated safety content and public-meetup norms — `src/app/(public)/safety/` |

**Full commerce toolkit** (all built, see Technical Audit §3 for the complete inventory):

- Fixed-price listings **and live auctions** with reserve prices and bid increments
- Offers / counter-offers with 48-hour expiry; real-time chat per listing (Ably)
- Want-to-buy board with automatic matching to new listings
- Collection manager (condition, grading — PSA/BGS/CGC, foils, folders), wishlist with price alerts
- Canonical card catalog with market-price data refreshed on schedule, powering price transparency
- Saved searches, push/email/SMS notifications, seller analytics

## 4. Market opportunity

- **Global TCG market:** estimates for 2025 range **US$7.8B–13.3B** depending on methodology, with forecast CAGRs of ~5–10%; one benchmark projects **US$21.05B by 2035**. **[Cited:** [Custom Market Insights](https://www.custommarketinsights.com/report/trading-card-games-market/), [Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/trading-card-game-market), [Research & Markets via Yahoo Finance](https://finance.yahoo.com/news/trading-card-games-analysis-report-114800642.html)**]**
- **Asia-Pacific:** ~**US$3.5B in 2025**, 6.6% CAGR through 2035 — and the **Philippines is explicitly named as an emerging TCG market** alongside India and Indonesia. **[Cited:** [Global Market Insights](https://www.gminsights.com/industry-analysis/trading-card-games-market)**]**
- **Category momentum:** One Piece TCG — one of our two launch categories — is in a global boom, with collector price indexes up **~61% in three months and ~119% in six months**. **[Cited:** [Card Chat](https://cardchat.substack.com/p/the-one-piece-card-boom-explained)**]** Filipino demand is visible in local retail (Game One PH, tcg.ph) and cross-border proxy-shopping volume for TCGplayer orders. **[Cited:** [Buyandship PH](https://www.buyandship.ph/blog/tcgplayer-philippines-best-selling-cards-1887527/)**]**
- **Serviceable market [Assumption]:** No published figure isolates PH peer-to-peer TCG trading volume. Founders should size this bottom-up (active members of the major PH Pokémon/One Piece Facebook groups × average trades/year × average transaction value) and insert the result here before formal fundraising.

## 5. Business model

**Freemium SaaS on sellers. Trades are free; power tools are paid.**

### Today: Power Seller subscription — ₱199 per 30 days

Non-recurring 30-day pass paid via PayMongo QR Ph (works with GCash, Maya, and PH banks). **[Code:** `POWER_SELLER_PRICE_PHP = 199` in `src/app/api/billing/subscribe/route.ts`; activation in `src/app/api/webhooks/paymongo/`**]**

| Capability | Free | Power Seller |
|---|---|---|
| Active listings | 10 | 50 |
| Photos per listing | 1 | 3 |
| Live auctions | ✗ | ✓ |
| Search results shown | 5 | 25 |
| Seller badge, analytics, search priority | ✗ | ✓ |
| **Commission on sales** | **0%** | **0%** |

*Enforced limits from* `src/lib/constants/tiers.ts` *and* `src/lib/capabilities.ts` **[Code]**.

The **0% commission / free listings** position is the wedge against Facebook groups (also free but unsafe) — monetization never taxes the trade itself, so there is no incentive to take deals off-platform.

### Built and dormant: online payments / escrow

The codebase already contains per-transaction PayMongo payment links and an `online_payments` feature flag, currently off. **[Code:** `src/lib/feature-flags.ts`, `transactions.method = "online"` in `src/db/schema/transactions.ts`**]** Once liquidity and trust density justify it, this switches on a second revenue stream — a small convenience/escrow fee on online-paid transactions — without new engineering.

### Future levers [Assumption]

Featured/boosted listings, higher subscription tiers (the enforcement system is tier-generic), event/LGS partnerships, and grading-service referral fees.

## 6. Go-to-market

**[Assumption — founder strategy, to be validated]**

1. **Community-first beta (Metro Manila):** seed supply by onboarding the most reputable sellers from the largest PH Pokémon/One Piece Facebook groups; their verified badges and ratings become the marketing.
2. **Local game store (LGS) partnerships:** stores as trusted meetup venues; co-branded events and tournament presence.
3. **Content:** TikTok/YouTube pack-opening and "is this card real?" scam-awareness content — safety is the brand.
4. **Product-led loops already built [Code]:** wishlist/want-ad matching notifies buyers the moment a matching card is listed (`src/lib/inngest/functions/wanted-match.ts`, `wishlist-match.ts`), pulling users back organically.
5. **Expansion:** Cebu/Davao metro areas → additional games (Yu-Gi-Oh!, MTG, Lorcana) → mobile apps.

## 7. Competition

| Alternative | Trust & safety | TCG-native features | Fees | Our edge |
|---|---|---|---|---|
| Facebook buy-and-sell groups | None — leading scam channel | None | Free | Same price (free), with verification, reputation, search, auctions |
| Carousell / FB Marketplace | Minimal | None (generic listings) | Free | Card catalog, condition/grading standards, auctions, price data |
| Local card shops / tcg.ph | High (retail) | Retail only | Retail margin | P2P prices; shops are partners (venues), not enemies |
| TCGplayer / eBay (cross-border) | High | Strong | 10–15% + shipping + customs | Local, cash-on-meetup, zero fees, PHP-native |

**Defensibility:** liquidity and reputation are network effects — a seller's rating history is non-portable, and buyers go where the cards are. Being first to *formalize* the meetup-trading culture in a market global players structurally can't serve (they are shipping/escrow-based) is the moat.

## 8. Traction & current status

Pre-launch. What exists today is the product itself — independently auditable in this repository (see [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md)):

- **45 pages, 75 API endpoints, 12 database schema modules, 7 automated background jobs** — feature-complete across listing, auction, offer, chat, transaction, meetup, rating, moderation, and admin flows **[Code]**
- **Real integrations, not mocks:** PayMongo payments, Didit KYC, Semaphore SMS, Ably realtime, Upstash, UploadThing, transactional email, web push **[Code]**
- **92 end-to-end tests** across 8 Playwright suites **[Code:** `e2e/`**]**
- Built as a disciplined 7-phase program (visible in commit history) in June 2026

**Honest framing:** the platform has no users, no GMV, and no operating history yet. The investment thesis is a *pre-launch* one: the build cost is already sunk, the burn is minimal (serverless stack), and capital goes to distribution, not construction.

## 9. Roadmap

| Phase | Milestone | Basis |
|---|---|---|
| Now | Pre-launch hardening (see Technical Audit §7 checklist) | Audit remediation plan |
| Launch (Q3 2026) | Public beta, Metro Manila, Pokémon + One Piece | **[Assumption]** |
| +3–6 mo | KYC gate for listings above ₱5,000 (scaffolded in code); Yu-Gi-Oh! & MTG categories | **[Code:** TODO in `src/app/api/listings/route.ts`; about page**]** |
| +6–12 mo | Online payments / escrow fee switch-on; iOS & Android apps | **[Code:** feature flag exists; about page**]** |
| +12 mo | Lorcana & additional games; regional expansion (Cebu, Davao) | **[Assumption]** |

## 10. Financial projections — **illustrative**

> ⚠️ **Every number in this section is an illustration** built from the stated assumptions to show how the model works. Replace with actuals/validated assumptions before any formal fundraising use. Pricing (₱199) and the 0% commission are real **[Code]**; everything else is **[Assumption]**.

### Assumptions

| Driver | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Registered users (end of year) | 10,000 | 40,000 | 100,000 |
| Active sellers (15% of registered) | 1,500 | 6,000 | 15,000 |
| Power Seller conversion (of active sellers, EOY) | 8% → 120 subs | 10% → 600 subs | 12% → 1,800 subs |
| Average paying subscribers through the year | 60 | 450 | 1,500 |
| Price per 30-day pass (actual) | ₱199 | ₱199 | ₱199 |
| Avg completed trades per active seller / month | 2 | 2 | 2 |
| Avg transaction value | ₱1,200 | ₱1,200 | ₱1,200 |
| Online-payment attach (share of GMV) | — | 5% (launches mid-year) | 25% |
| Online-payment take rate | — | 2.5% | 2.5% |

### Illustrative results

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Gross marketplace volume (GMV) | ₱21.6M | ₱108M | ₱302M |
| Subscription revenue | ₱143K | ₱1.07M | ₱3.58M |
| Online-payment fee revenue | — | ₱135K | ₱1.89M |
| **Total revenue** | **₱0.14M** | **₱1.21M** | **₱5.47M** |
| Infrastructure & per-use vendor costs* | ₱300K | ₱720K | ₱1.8M |
| Team & marketing | *founders to model* | *founders to model* | *founders to model* |

\* Serverless stack (Vercel, Neon, Upstash, Ably, UploadThing) plus per-use KYC, SMS, and PayMongo fees — scales with usage, near-zero at idle. **[Assumption]**

**What the model shows:** subscription revenue alone is modest; the business becomes venture-scale when (a) the online-payment/escrow lever switches on against a growing GMV base, and (b) category expansion multiplies the seller pool. GMV is therefore the KPI to watch from day one — the monetization rails for it are already built.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Chicken-and-egg liquidity | Community-first seller onboarding; want-to-buy board generates demand signals even with thin supply; matching jobs recycle attention **[Code]** |
| Facebook inertia ("free and everyone's there") | Also free, plus verification/reputation/auctions FB can't offer; scam-awareness content marketing |
| Off-platform leakage (meet via app, deal outside) | 0% commission removes the incentive; ratings only accrue to on-platform deals |
| Meetup safety incidents | KYC + no-show tracking + public-venue guidance; LGS partnerships as safe venues **[Code:** safety page, KYC flow**]** |
| Single-developer bus factor & 4-day-old codebase | Technical audit finds strong fundamentals; remediation checklist (CI, observability, docs) in §7 of the audit; hire #1 is an engineer |
| Platform dependency (Didit, PayMongo, Ably pricing) | All are replaceable commodity services behind thin wrappers **[Code:** `src/lib/*.ts` adapters**]** |

## 12. Team & the ask

> *Placeholders — to be completed by the founders:*
>
> - **Team:** founder bios, relevant TCG-community and engineering credentials, advisors.
> - **The ask:** amount, instrument (e.g., SAFE), valuation cap, and use of funds. Suggested framing given §10: 12–18 months of runway allocated primarily to go-to-market (community seeding, LGS partnerships, content) and one engineering hire, with infrastructure costs largely usage-driven.

---

*Sources: [Custom Market Insights](https://www.custommarketinsights.com/report/trading-card-games-market/) · [Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/trading-card-game-market) · [Global Market Insights](https://www.gminsights.com/industry-analysis/trading-card-games-market) · [Research & Markets via Yahoo Finance](https://finance.yahoo.com/news/trading-card-games-analysis-report-114800642.html) · [ScamWatchHQ (TransUnion data)](https://www.scamwatchhq.com/philippines-scams-2025-second-highest-global-fraud-rate-sparks-national-crisis-response/) · [GSMA](https://www.gsma.com/newsroom/press-release/rising-scam-exposure-in-the-philippines-underscores-need-for-cross-sector-action-warns-new-gsma-report/) · [Card Chat](https://cardchat.substack.com/p/the-one-piece-card-boom-explained) · [Buyandship PH](https://www.buyandship.ph/blog/tcgplayer-philippines-best-selling-cards-1887527/)*
