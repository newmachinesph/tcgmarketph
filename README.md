# TCGMarket PH

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Postgres](https://img.shields.io/badge/Postgres-Drizzle-336791)

A peer-to-peer marketplace for trading card games (Pokemon, One Piece) in the Philippines, built around cash-on-meetup trades with identity verification, seller ratings, offers, wanted posts and live auctions. Pre-launch MVP; the repository is archived.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Postgres via Drizzle ORM (Neon), better-auth, Upstash Redis, Ably (realtime), Inngest, UploadThing, PayMongo, Didit (KYC), Semaphore (SMS), Playwright (e2e).

## Getting started

```bash
npm install
# create .env.local with DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL and the
# other service keys read via process.env in src/ and scripts/
npm run db:extensions   # enable Postgres extensions
npm run db:push         # apply schema
npm run db:seed         # seed the card catalog
npm run dev             # http://localhost:3000
```

Optional sample data: set `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD`, then `npm run db:sim` (wipes user data). The Playwright specs in `e2e/` read the same variables.

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run db:generate`, `npm run db:studio`.

## Structure

- `src/app/` - routes: public pages, authenticated app, auth, admin, `api/`
- `src/components/`, `src/lib/`, `src/db/`, `src/emails/`, `src/store/` - UI, services, schema, email templates, state
- `drizzle/` - SQL migrations
- `scripts/` - seeding and maintenance scripts
- `e2e/` - Playwright tests
- `docs/investor/` - business plan, executive summary and technical audit

Card images in `public/cards/` are samples of third-party trading card artwork used for demo purposes only; they belong to their respective rights holders.

## License

[MIT](LICENSE)
