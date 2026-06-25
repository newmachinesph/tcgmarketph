# TCGmarket — Marketplace Build Plan

> Reference doc. Update decisions here as they change. Each phase is a hard stop — ship, verify, then continue.

---

## Context

TCG marketplace for the Philippines — Pokémon and One Piece cards.  
**What's already built:** Auth, profile setup, collection (folders, drag-and-drop, favorites), wishlist (acquire flow), browse/search, dashboard, settings, price refresh job, currency persistence (PHP/USD per user).

---

## Core Decisions

| Topic | Decision | Reason |
|-------|----------|--------|
| Payment | Cash on meetup only at launch | No payment processor yet; PH norm for C2C |
| Sell gate | Phone-verified | Lower friction than KYC; Carousell PH doesn't require it either |
| KYC hook | Leave enforcer stub for listings > ₱5,000 | KYC infra in PH still maturing; don't block supply |
| Trades | **Out of scope** for this build | Adds schema complexity before fixed-price/auction are validated |
| Free tier | 10 active listings, 3 photos per listing | Enough for casual sellers; creates upgrade pressure |
| Power Seller | 500 active listings, 10 photos per listing | Hard cap even for paid — easier to enforce and raises later |
| Listing expiry | 30 days, auto-expire via Inngest | Keeps catalog fresh |
| Commission | Store `commission_rate` on tier (default 0%) from day one | Avoids schema rewrite when monetization kicks in |
| Reputation | Display from Phase 3; collect ratings in Phase 6 | Auctions need trust signal before rating system ships |
| Bid integrity | Server-side row locking, anti-shill, Upstash rate limits | Non-negotiable for auction fairness |
| Anti-snipe | Extend auction by configurable window (default 30s) if bid in final moments | Standard auction UX |

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 App Router |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Better Auth (built) |
| Card data | `card_catalog` table (built) |
| Image upload | UploadThing |
| Real-time | Ably (live bids + chat) |
| Scheduled jobs | Inngest |
| Rate limiting | Upstash Redis |
| Search | Postgres `pg_trgm` |
| Email / SMS | Resend / Semaphore |

---

## Phases

### Phase 1 — Listings (fixed-price sell) `[x]`

**Goal:** A phone-verified user can list a card for sale at a fixed price.

**Schema:**
- `listings` — seller, catalog card ref, condition, grade (optional), quantity, price (PHP), description, type (`fixed_price` | `auction`), status (`active` | `paused` | `sold` | `cancelled` | `expired`), expires_at
- `listing_photos` — listing ref, UploadThing URL, display order

**Rules:**
- Gate: logged in + phone verified
- Enforce tier listing cap (free: 10, power_seller: 500) on creation
- Leave stub: if price > ₱5,000, log a TODO for future KYC gate
- Auto-expire after 30 days via Inngest job

**Screens:**
- Create listing (standalone + pre-filled from collection entry)
- Edit / pause / cancel listing
- Listing detail (photos, seller name + reputation score placeholder)
- My listings management page

**Stop & verify:** Create from scratch, create from collection card, photo upload, listing detail page.

---

### Phase 2 — Browse & search listings `[x]`

**Goal:** Buyers can find cards for sale.

**Features:**
- `/marketplace` — all active listings
- Filters: game, set, condition, graded/raw, price range
- Search: card name via `pg_trgm` on catalog joined to active listings
- Sort: newest, price low→high, price high→low
- Seller reputation score visible on each result card (display only)
- Clear empty states per filter combination

**Stop & verify:** Browse, filter, search, sort across both games.

---

### Phase 3 — Buy intent & meetup coordination `[x]`

**Goal:** Buyer commits to a fixed-price listing; parties arrange a cash meetup.

**Schema:**
- `transactions` — listing ref, buyer, seller, agreed price, `method` (default `cash_meetup`, room for `online` later), `status` (`pending` | `agreed` | `completed` | `cancelled` | `no_show` | `disputed`)
- `meetup_proposals` — transaction ref, proposer, location, proposed_at (datetime), status (`pending` | `accepted` | `declined`)

**Rules:**
- "Buy" creates a pending transaction, notifies seller (Resend/Semaphore)
- Seller confirms → status `agreed`, listing marked sold / quantity decremented
- Structured meetup proposal: location + date/time both sides accept
- Safe-meetup guidance text shown at every step (public place, daytime, mall)
- Reputation score shown on both buyer and seller throughout
- Either party marks `completed` or `no_show` / `cancelled` after the meeting

**Stop & verify:** Buyer commits, seller confirms, meetup proposal flow, mark complete/no-show.

---

### Phase 4 — Offers (negotiate price) `[x]`

**Goal:** Buyer can offer a different price on a fixed-price listing.

**Schema:**
- `offers` — listing ref, buyer, offered price, message (optional), status (`pending` | `accepted` | `declined` | `countered` | `expired`), expires_at

**Rules:**
- Seller can accept (→ creates agreed transaction), decline, or counter
- Offers expire after 48 hours (Inngest)
- Rate-limit: max 1 open offer per buyer per listing (Upstash)
- Notify both parties on every status change

**Stop & verify:** Make offer, seller accept/decline/counter, resulting transaction on accept.

---

### Phase 5 — Auctions & live bidding `[ ]`

**Goal:** Card sold by timed auction; highest bid at close wins.

**Schema:**
- Extend `listings` with: `starting_price`, `current_bid`, `bid_increment`, `reserve_price` (optional), `auction_start`, `auction_end`
- `bids` — listing ref, bidder, amount, placed_at

**Rules:**
- Every bid validated server-side: amount > current_bid + increment
- Postgres `SELECT ... FOR UPDATE` row lock on bid insert (no race conditions)
- Block seller from bidding on own auction (anti-shill check)
- Rate-limit bid frequency per user (Upstash)
- Anti-snipe: bid in final 30s → extend auction by 30s (configurable)
- Inngest scheduled job closes auction: lock bidding, pick winner, create agreed transaction, notify winner + seller
- Real-time bid updates via Ably

**Screens:**
- Create auction listing
- Auction detail: live bid feed, countdown, current price, place bid
- My bids / my auctions management

**Stop & verify:** Create auction, two users bid live, anti-snipe extension, auto-close picks winner.

---

### Phase 6 — Trust system (ratings & reputation) `[ ]`

**Goal:** Strangers trust each other enough to meet.

**Schema:**
- `ratings` — transaction ref, rater, ratee, score (1–5), comment (optional), created_at
- One rating per party per completed transaction

**Rules:**
- Both parties can rate after `completed` status
- Reputation = average score + completed deal count, stored on `user.reputation_score`
- `no_show` outcome decrements reputation; track `no_show_count` on user
- "Verified Seller" badge for phone-verified users (KYC badge reserved for later)

**Stop & verify:** Rate after completed deal, reputation on profile, no-show affecting score.

---

### Phase 7 — In-app chat `[ ]`

**Goal:** Buyer and seller coordinate the meetup via messages.

**Schema:**
- `conversations` — listing/transaction ref, participant A, participant B
- `messages` — conversation ref, sender, body, sent_at, read_at

**Rules:**
- Real-time delivery via Ably; persist in Postgres
- Open chat from listing, offer, or transaction
- Notify via Semaphore/Resend if recipient is offline
- Report-user and block-user actions inside chat

**Stop & verify:** Two users chat in real time, open from listing, report/block.

---

### Phase 8 — Reporting, moderation & admin `[ ]`

**Goal:** Bad actors and bad listings can be handled.

**Schema:**
- `reports` — reporter, target type (`user` | `listing` | `message`), target id, reason, status (`open` | `reviewing` | `resolved` | `dismissed`)
- `admin_actions` — admin user, action type, target, note, created_at

**Screens (admin only):**
- Open reports queue
- Take down listing
- Ban user (flag already on user table)
- View user's deal / no-show history

**Stop & verify:** File report, admin queue, take down listing, ban user.

---

## Out of Scope (this build)

- Online payments / escrow / PayMongo — method field exists, wiring is later
- Power-seller subscription billing — tier flag exists, billing is later
- Shipping / logistics — meetup only
- Trades (card swaps) — deferred until fixed-price + auction are validated
- Wishlist → listing match notifications — wishlist data exists; matching engine is a separate build

---

## Listing Tier Limits (enforce from Phase 1)

| Tier | Active listings | Photos per listing | Commission rate |
|------|----------------|-------------------|----------------|
| `free` | 10 | 3 | 0% |
| `power_seller` | 500 | 10 | 0% |

---

## Key Invariants (apply to every phase)

1. Every listing, bid, offer, message, and rating belongs to a logged-in user
2. Creating a listing requires phone-verified — checked server-side, not just in middleware
3. `transactions.method` and `transactions.status` must never be hardcoded — always from the enum
4. Auction bid inserts must use row-level locking — no exceptions
5. Seller can never bid on their own auction
6. Money never flows through the platform at this stage
