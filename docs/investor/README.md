# TCGMarket PH — Investor Package

This folder contains the investor-facing documentation for **TCGMarket PH** (tcgmarket.ph), a safety-first, cash-on-meetup marketplace for trading card games in the Philippines.

## Documents

| Document | Audience | Purpose |
|---|---|---|
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | Everyone | One-page overview: product, market, model, status, ask |
| [BUSINESS_PLAN.md](./BUSINESS_PLAN.md) | Investors | Full business plan: problem, market, product, business model, competition, roadmap, illustrative financials |
| [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md) | Technical due diligence | Evidence-based audit of the codebase: architecture, security, quality, gaps, and remediation roadmap |

## How to read this package

1. Start with the **Executive Summary** (2 minutes).
2. Read the **Business Plan** for the opportunity and model (15 minutes).
3. Hand the **Technical Audit** to a technical advisor for due diligence (20 minutes).

## Honesty policy

Every claim in these documents traces to one of three sources, and each is labeled accordingly:

- **Code** — a file path in this repository (verifiable by anyone with repo access).
- **Cited** — an external source, linked inline.
- **Assumption** — an illustrative figure chosen by the founders, marked as such. All financial projections are illustrative and must be replaced with actuals before use in a formal fundraising process.

## Exporting to PDF

Any of these renders cleanly to PDF via GitHub's print view, VS Code's Markdown PDF extension, or:

```bash
npx md-to-pdf docs/investor/EXECUTIVE_SUMMARY.md
```

---

*Package prepared July 2026. Maintained in-repo so it stays versioned alongside the product it describes.*
