# TCGMarket PH — Executive Summary

**The safest way to buy and sell trading cards in the Philippines.**
Domain: [tcgmarket.ph](https://tcgmarket.ph) · Status: **Pre-launch MVP, feature-complete** · Prepared: July 2026

---

## The problem

Filipino trading-card players buy and sell almost entirely through **Facebook buy-and-sell groups and general marketplaces** (Carousell, FB Marketplace) — channels with no seller verification, no reputation system, and no recourse. The Philippines has the **second-highest suspected digital-fraud rate in the world** (13.4% of digital transactions flagged in 2025), and social media buy-and-sell groups are the leading scam channel ([TransUnion via ScamWatchHQ](https://www.scamwatchhq.com/philippines-scams-2025-second-highest-global-fraud-rate-sparks-national-crisis-response/), [GSMA](https://www.gsma.com/newsroom/press-release/rising-scam-exposure-in-the-philippines-underscores-need-for-cross-sector-action-warns-new-gsma-report/)). For high-value collectibles like graded Pokémon and One Piece cards, buyers and sellers have nowhere purpose-built and trustworthy to transact.

## The solution

**TCGMarket PH** is a dedicated peer-to-peer TCG marketplace built around the way Filipinos actually trade cards: **cash-on-meetup**. No shipping risk, no payment fraud — the platform's job is to make the *people* trustworthy:

- **Verified sellers** — phone OTP verification plus government-ID KYC (Didit)
- **Public reputation** — post-transaction ratings, no-show tracking, community reports, admin moderation
- **Full commerce toolkit** — fixed-price listings, **live auctions**, offers and counter-offers, real-time chat, a want-to-buy board, collection and wishlist management, and price alerts
- **Zero fees on trades** — 0% commission, free listings

Live today for **Pokémon TCG and One Piece TCG**; Yu-Gi-Oh!, Magic: The Gathering, and Lorcana are next.

## The market

- Global TCG market: **US$13.3B (2025)**, growing at ~5–10% CAGR depending on source ([Custom Market Insights](https://www.custommarketinsights.com/report/trading-card-games-market/), [Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/trading-card-game-market))
- Asia-Pacific: **~US$3.5B (2025)**, 6.6% CAGR to 2035, with the **Philippines explicitly identified as an emerging market** ([Global Market Insights](https://www.gminsights.com/industry-analysis/trading-card-games-market))
- One Piece TCG — a flagship category for TCGMarket PH — is in a boom, with price indexes up **~119% over six months** ([Card Chat](https://cardchat.substack.com/p/the-one-piece-card-boom-explained))

## Business model

Freemium SaaS for sellers — trades stay free, power tools are paid:

| | Free | **Power Seller — ₱199 / 30 days** |
|---|---|---|
| Active listings | 10 | 50 |
| Photos per listing | 1 | 3 |
| Live auctions | — | ✅ |
| Analytics, badge, search priority | — | ✅ |
| Commission on sales | **0%** | **0%** |

A second revenue lever — **online payments / escrow with a transaction fee** — is already built into the codebase behind a feature flag, ready to switch on once liquidity is established.

## Current status

A **production-grade MVP is built and feature-complete**: 45 pages, 75 API endpoints, live payments (PayMongo/QR Ph), KYC, SMS OTP, real-time chat and auctions (Ably), 7 automated background jobs, an admin console, and 92 end-to-end tests. An independent technical audit of the codebase (included in this package) rates the architecture and security fundamentals as strong, with a concrete pre-launch hardening checklist. The platform is **pre-launch and pre-revenue**; the near-term milestone is a public beta in Metro Manila's Pokémon and One Piece communities.

## The ask

> *Placeholder — to be completed by the founders: amount raised, instrument, use of funds (e.g., 12–18 months of runway for launch marketing, community partnerships, mobile apps, and first hires).*

---

*Full details: [BUSINESS_PLAN.md](./BUSINESS_PLAN.md) · Technical due diligence: [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md)*
