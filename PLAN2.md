# TCGmarket — Phase 2 Roadmap

> Continuation of PLAN.md (Phases 1–8 complete). Same rules: each phase is a hard stop — ship, verify, then continue.

---

## Context

All core marketplace flows are live: listings, browse, buy, offers, auctions, transactions, ratings, chat, reporting.
This roadmap adds trust, discovery, safety, and seller tooling on top of that foundation.

---

## Phases

### Phase 9 — Block user `[x]`

**Goal:** Users can block others from contacting or messaging them.

**Schema:**
- `blocked_users` — blocker_id, blocked_id, created_at
- Unique index on `(blocker_id, blocked_id)`

**Rules:**
- Blocking prevents the blocked user from opening a new conversation with the blocker
- Blocking prevents the blocked user from sending messages in any existing conversation with the blocker
- Both `POST /api/conversations` and `POST /api/conversations/[id]/messages` check the block table
- Blocked user sees a generic "cannot message this user" error — do not reveal they are blocked
- Blocker can unblock at any time (`DELETE /api/blocks/[id]`)
- Blocking a user does NOT delete existing messages (history stays for evidence)

**API:**
- `POST /api/blocks` — block a user (`{ blockedId }`)
- `DELETE /api/blocks/[blockedId]` — unblock
- `GET /api/blocks` — list of users the current user has blocked

**UI:**
- "Block user" option next to "Report user" in the chat header (`/messages/[id]`)
- Blocked users list in `/settings` (with unblock button)
- Graceful error shown in input area when the other party has blocked you

**Stop & verify:** Block from chat, blocked user cannot send, unblock restores messaging, settings list accurate.

---

### Phase 10 — Public seller profiles `[x]`

**Goal:** Buyers can view any seller's public presence before committing to a deal.

**Schema:** No new tables — uses existing `user`, `listings`, `ratings`, `transactions`.

**API:**
- `GET /api/sellers/[id]` — public profile: display name, city, rep score, avg rating, completed deals, no-show count, phone-verified flag, joined date, active listings (paginated), recent ratings received
- No private fields (email, phone, banned status) exposed

**Rules:**
- Banned users' profiles still render but show no active listings
- Own profile page (`/profile`) links to their public seller page

**Screens:**
- `/sellers/[id]` — public profile page
  - Avatar, display name, verified badge, city
  - Rep stats: completed deals, avg star rating, no-show count
  - Active listings grid (same card as marketplace)
  - Ratings feed (score + comment + date, newest first, paginated)
  - "Message Seller" button (same flow as listing detail)

**Wiring:**
- Seller name on listing detail page links to `/sellers/[listing.sellerId]`
- Rater name on profile ratings feed links to `/sellers/[raterId]`
- Seller name on marketplace listing cards links to `/sellers/[sellerId]`

**Stop & verify:** View own and another user's public profile, active listings show correctly, ratings feed paginated, message button opens chat.

---

### Phase 11 — Notification center `[x]`

**Goal:** Wire up the bell icon in the header with real-time in-app notifications.

**Schema:**
- `notifications` — id, user_id, type (enum), title, body, link (nullable), read_at (nullable), created_at
- `notification_type` enum: `offer_received` | `offer_accepted` | `offer_declined` | `offer_countered` | `auction_won` | `auction_outbid` | `auction_ending_soon` | `transaction_agreed` | `transaction_completed` | `message_received` | `wishlist_match` | `system`

**Rules:**
- Notifications are created server-side at the point where the event occurs (offer route, auction close job, chat message route, etc.)
- Real-time delivery via Ably channel `notifications:{userId}`
- Mark read on open (individual) or "Mark all read" button
- Maximum 200 unread notifications kept per user; older ones auto-trimmed

**API:**
- `GET /api/notifications` — list (unread first, then read), `?limit=50&offset=0`, returns `unreadCount`
- `PATCH /api/notifications/[id]/read` — mark one read
- `PATCH /api/notifications/read-all` — mark all read

**UI:**
- `NotificationsBell` client component (replaces the dead `BellIcon` in AppHeader)
  - Polls `GET /api/notifications` every 60 s + subscribes to Ably `notifications:{uid}` for instant delivery
  - Red badge showing unread count (same style as MessagesNavItem)
  - Click opens dropdown: list of notifications with icon, title, time-ago, link
  - "Mark all read" button at the top
- Clicking a notification navigates to its `link` and marks it read

**Wiring (emit notifications from existing routes):**
| Event | Recipient(s) |
|-------|-------------|
| Offer received | seller |
| Offer accepted / declined / countered | buyer |
| Bid outbid | previous high bidder |
| Auction won | winner |
| Auction ending in 1 h | all bidders |
| Transaction agreed | buyer + seller |
| Transaction completed | buyer + seller |
| New chat message (recipient offline) | recipient |

**Stop & verify:** Receive notification for offer, see badge update in real time, click navigates + marks read, mark-all-read works.

---

### Phase 12 — Wishlist match alerts `[x]`

**Goal:** When a card a buyer wants gets listed, notify them automatically.

**Dependencies:** Phase 11 (notification center) must be live first.

**Schema:** No new tables — `wishlist` and `card_catalog` already exist; `notifications` from Phase 11 is used.

**Rules:**
- Trigger: new active listing inserted (fixed-price or auction)
- Match: any wishlist entry where `cardId` = listing's `cardId` AND wisher ≠ seller
- Create one `wishlist_match` notification per matching wisher
- Also send an email via nodemailer (non-blocking, fire-and-forget)
- Rate-limit: max 1 match notification per wisher per listing per 24 h (prevent spam on re-list)
- Respect block list: don't notify if seller has blocked the wisher (or vice versa)

**Inngest job:**
- `listings/wishlist.match` — triggered synchronously after listing creation in `POST /api/listings`
- Queries all wishlist entries for matching `cardId`, filters self + blocked, inserts notifications in batch, fires emails

**Email template:** "A card on your wishlist is now listed — [Card Name] for ₱X. View listing →"

**Stop & verify:** Add card to wishlist, create listing for that card from another account, wisher receives in-app notification and email within seconds.

---

### Phase 13 — Seller analytics `[ ]`

**Goal:** Sellers see how their listings are performing.

**Schema:**
- `listing_views` — listing_id, viewer_id (nullable, null = anonymous), viewed_at, ip_hash
- Unique partial index: one view per viewer per listing per day to prevent inflation

**Rules:**
- Record a view on every `GET /api/listings/[id]` call (server-side, fire-and-forget)
- Anonymous views counted (ip_hash, no viewer_id); authenticated views attach viewer_id
- Own views (seller viewing their own listing) are excluded from the count
- Analytics only visible to the listing owner

**API:**
- `GET /api/analytics/listings` — seller's listings with view count, offer count, conversion rate (offers → transactions)
- `GET /api/analytics/listings/[id]` — single listing detail: daily views (last 30 days), offer funnel, time-to-close

**Screens:**
- `/dashboard` gains an **Analytics** tab (alongside the existing content)
  - Summary cards: total active listings, total views this month, offers received, deals closed
  - Listings table: card name | views | offers | status | listed date
  - Clicking a row expands a sparkline of daily views + offer timeline

**Stop & verify:** View a listing as buyer, seller sees count increment, offer funnel shows correct numbers, daily chart renders.

---

## Out of Scope (this roadmap)

- PayMongo / online escrow — method field exists; wiring is a separate project
- Power-seller subscription billing — tier flag exists; billing is separate
- Shipping / logistics — meetup only
- Trades — deferred until analytics validate fixed-price demand
- Mobile PWA / push notifications — web notifications only for now
- KYC for listings > ₱5,000 — stub exists; KYC infra deferred

---

## Key Invariants (carry forward)

1. All new API routes enforce session checks — no public mutation endpoints
2. Admin-only routes return 403 (not 404) for non-admins
3. Block checks run server-side, never client-side
4. Notification inserts are fire-and-forget — never block the main request
5. Analytics views are recorded asynchronously — listing detail latency must not increase
