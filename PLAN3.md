# TCGmarket — Phase 3 Roadmap

> Continuation of PLAN2.md (Phases 1–13 complete). Same rules: each phase is a hard stop — ship, verify, then continue.

---

## Context

Core marketplace, trust, notifications, and seller analytics are all live.
This roadmap closes the remaining operational gaps: admin visibility, dispute resolution, notification control, saved searches, and platform health tooling.

**Already built (don't rebuild):**
- Phone OTP: `/api/otp/send` + `/api/otp/verify` + `PhoneVerify` component ✓
- Marketplace search + filters ✓
- Buy Now button on listing detail ✓
- Admin: reports queue, user detail, ban/unban, listing takedown ✓
- Dispute/no-show status on transactions ✓

---

## Phases

### Phase 14 — Admin dashboard & user list `[x]`

**Goal:** Admins can see platform health at a glance and search/manage all users — the two missing pieces from the existing admin panel.

**What's missing:**
- No `/admin` home page (navigating to `/admin` hits a 404)
- No user search/list — admins can only reach `/admin/users/[id]` if they already know the ID
- No platform-level stats

**Schema:** No new tables.

**API:**
- `GET /api/admin/stats` — total users, total listings, open reports count, transactions this week, banned users count
- `GET /api/admin/users` — paginated user list with `?q=` name/email search, `?banned=true` filter

**Screens:**
- `/admin` — home: stat cards (users, listings, open reports, txn this week) + quick links to Reports and Users
- `/admin/users` — searchable/filterable user table: avatar, name, email, phone verified badge, ban status, joined date, link to `/admin/users/[id]`

**Nav wiring:**
- Add "Admin" link to AppHeader (isAdmin only, same as existing admin check)
- Sidebar or sub-nav within `/admin/*` pages: Dashboard | Reports | Users

**Stop & verify:** Admin sees stats, searches for a user by name, navigates to their profile.

---

### Phase 15 — Dispute resolution flow `[x]`

**Goal:** When a no-show or dispute is reported on a transaction, admins can review and take action — currently no-show/disputed status exists but there's no resolution path.

**Schema:**
- Add `resolvedAt`, `resolvedBy`, `adminNote` columns to `transactions` table
- No new tables

**Rules:**
- Either party can mark a transaction `no_show` or `disputed` from the transaction detail page (already exists)
- Admin can view all disputed/no-show transactions in a dedicated queue
- Admin resolution actions: `resolve_seller_fault` (increments seller noShowCount), `resolve_buyer_fault` (increments buyer noShowCount), `resolve_no_fault` (clears status back to agreed), add a private admin note
- Notifications sent to both parties on resolution
- noShowCount ≥ 3 auto-suggests ban (warning in admin UI, not automatic)

**API:**
- `GET /api/admin/disputes` — list transactions with status `no_show` or `disputed`, newest first
- `POST /api/admin/disputes/[id]/resolve` — `{ action: "seller_fault" | "buyer_fault" | "no_fault", note?: string }`

**Screen:**
- `/admin/disputes` — queue of open disputes with transaction detail, parties involved, meetup location/time, resolve buttons + note input
- Add "Disputes" link to admin sub-nav

**Stop & verify:** Mark a transaction disputed, admin sees it in queue, resolves with fault, noShowCount increments on the right user.

---

### Phase 16 — Notification preferences `[x]`

**Goal:** Users control which emails they receive. Required for CAN-SPAM / legal compliance and to reduce unsubscribe friction.

**Schema:**
- Add `emailPrefs` JSONB column to `user` table (default: all enabled)
  ```
  { offers: true, messages: true, wishlist: true, transactions: true, system: true }
  ```

**Rules:**
- `system` emails (password reset, account changes) cannot be disabled
- Email helpers check prefs before sending — `wishlist` pref gates `emailWishlistMatch`, `offers` pref gates offer emails, etc.
- One-click unsubscribe token in email footer (signed JWT, no login required)
- Clicking unsubscribe link disables the relevant category and shows a confirmation page

**API:**
- `GET /api/account/email-prefs` — return current prefs
- `PATCH /api/account/email-prefs` — update prefs `{ offers?, messages?, wishlist?, transactions? }`
- `GET /api/unsubscribe?token=xxx` — verify JWT token, disable category, return confirmation (public, no auth)

**Screen:**
- `/settings` gains an **Email Notifications** section (between Security and Blocked Users)
  - Toggle row per category with label + description
  - Save button

**Wiring:**
- All `email*.ts` helpers accept optional userId and check prefs before sending
- Footer of every email: "Unsubscribe from [category] emails →" link with signed token

**Stop & verify:** Disable offer emails in settings, make an offer — email is suppressed. Unsubscribe link from email disables category.

---

### Phase 17 — Saved searches & price drop alerts `[x]`

**Goal:** Buyers can save a marketplace search and get notified when a new listing matches, or when a listed card drops in price.

**Schema:**
- `saved_searches` — id, userId, name (user-given), query (JSON: { q, game, condition, minPrice, maxPrice }), lastNotifiedAt, createdAt
- `price_alerts` — id, userId, listingId, targetPrice (PHP), triggeredAt (nullable), createdAt
  - Unique index on (userId, listingId)

**Rules:**
- Max 10 saved searches per user (free tier)
- Saved search notifications: when `POST /api/listings` creates a listing matching the saved query, fire Inngest job → notify wisher (same pattern as wishlist match)
- Price drop alert: when seller edits listing price down, check for price alerts → notify users whose targetPrice ≥ new price
- Rate-limit: 1 notification per saved search per user per 24 h

**API:**
- `GET /api/saved-searches` — list
- `POST /api/saved-searches` — save current search `{ name, query }`
- `DELETE /api/saved-searches/[id]`
- `POST /api/price-alerts` — set alert `{ listingId, targetPrice }`
- `DELETE /api/price-alerts/[listingId]`
- `GET /api/price-alerts` — list active alerts

**UI:**
- Marketplace: "Save Search" button (bookmark icon) in the filter bar — prompts for a name, calls POST
- `/wishlist` page gains a **Saved Searches** tab alongside the card wishlist
- Listing detail: "Alert me if price drops" button with target price input

**Inngest jobs:**
- `listings/saved-search.match` — triggered on new listing, same pattern as wishlist match
- Price drop check inline in `PATCH /api/listings/[id]` — fire-and-forget

**Stop & verify:** Save a search, create a listing that matches from another account, get notification. Set price alert, lower price from seller account, get notification.

---

### Phase 18 — Platform health & moderation metrics `[x]`

**Goal:** Admins can monitor platform trends and catch abuse early without manually sifting through data.

**Schema:** No new tables — queries against existing data.

**API:**
- `GET /api/admin/metrics` — time-series data for the last 30 days:
  - New users per day
  - New listings per day
  - Transactions completed per day
  - Reports filed per day
  - Bans issued per day

**Screen:**
- `/admin` home page (Phase 14) gains a **Metrics** section below the stat cards
  - Five sparkline charts (same SVG bar chart component as seller analytics)
  - Date range selector: 7d / 30d / 90d

**Moderation helpers (passive, no new schema):**
- Users with noShowCount ≥ 3 are flagged with a warning badge in `/admin/users`
- Users with > 5 open reports against them are highlighted in the reports queue
- Listings reported > 3 times get an "Frequently reported" tag in admin views

**Stop & verify:** Admin sees daily new-user chart, flagged users show warning badge, frequently-reported listing is highlighted.

---

## Out of Scope (this roadmap)

- PayMongo / online escrow — excluded by request
- KYC document upload — stub exists; infra deferred
- Power-seller subscription billing — tier flag exists; billing is separate
- Shipping / logistics — meetup only
- Mobile PWA / push notifications — web only
- Trades / swap listings — deferred

---

## Key Invariants (carry forward)

1. All new API routes enforce session checks — no public mutation endpoints
2. Admin-only routes return 403 (not 404) for non-admins
3. Notification inserts are fire-and-forget — never block the main request
4. Email sending always checks prefs (Phase 16+) before delivering
5. Inngest jobs for match alerts follow the same block-list + rate-limit pattern as wishlist match
