/**
 * Add a few demo auction listings with bids (without wiping other data).
 * Run: node --env-file=.env.local -e "require('tsx/cjs'); require('./scripts/add-auctions.ts')"
 */

import { readFileSync } from "fs";
import { join }         from "path";
try {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* rely on existing env */ }

import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db }       from "../src/lib/db";
import { user }     from "../src/db/schema/auth";
import { cardCatalog } from "../src/db/schema/cards";
import { listings, bids } from "../src/db/schema/listings";

const uid  = () => createId();
const hrs  = (n: number) => new Date(Date.now() + n * 3_600_000);
const ago  = (n: number) => new Date(Date.now() - n * 3_600_000);

async function main() {
  // ── Find seller IDs ─────────────────────────────────────────────────────────
  const sellers = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.sellerEnabled, true));

  if (sellers.length === 0) {
    console.error("No sellers found — run seed-sim.ts first!");
    process.exit(1);
  }

  const buyers = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.sellerEnabled, false));

  const seller1 = sellers.find(s => s.email === "joven@test.com")  ?? sellers[0];
  const seller2 = sellers.find(s => s.email === "mira@test.com")   ?? sellers[0];
  const seller3 = sellers.find(s => s.email === "lian@test.com")   ?? sellers[0];
  const buyer1  = buyers.find(b  => b.email  === "marco@test.com") ?? buyers[0];
  const buyer2  = buyers.find(b  => b.email  === "aria@test.com")  ?? buyers[1] ?? buyers[0];
  const buyer3  = buyers.find(b  => b.email  === "kevin@test.com") ?? buyers[2] ?? buyers[0];

  // ── Pick cards ───────────────────────────────────────────────────────────────
  const cards = await db
    .select({ id: cardCatalog.id, name: cardCatalog.name, game: cardCatalog.game })
    .from(cardCatalog);

  const pkm = cards.filter(c => c.game === "pokemon");
  const op  = cards.filter(c => c.game === "one_piece");

  if (!pkm.length || !op.length) {
    console.error("Card catalog empty — run seed-cards.ts first!");
    process.exit(1);
  }

  const get = <T>(arr: T[], i: number) => arr[i % arr.length];

  // ── Create auction listings ──────────────────────────────────────────────────
  console.log("🔨 Creating auction listings...");

  async function mkAuction(opts: {
    sellerId:      string;
    card:          { id: string; name: string };
    startingPrice: string;
    currentBid?:   string;
    bidIncrement:  string;
    reservePrice?: string;
    endsInHours:   number;
    description:   string;
    condition?:    "near_mint" | "lightly_played";
  }) {
    const id     = uid();
    const end    = hrs(opts.endsInHours);
    const start  = ago(24);
    await db.insert(listings).values({
      id,
      sellerId:      opts.sellerId,
      cardId:        opts.card.id,
      type:          "auction",
      price:         opts.startingPrice,
      startingPrice: opts.startingPrice,
      currentBid:    opts.currentBid ?? null,
      bidIncrement:  opts.bidIncrement,
      reservePrice:  opts.reservePrice ?? null,
      auctionStart:  start,
      auctionEnd:    end,
      condition:     opts.condition ?? "near_mint",
      quantity:      1,
      description:   opts.description,
      status:        "active",
      expiresAt:     end,
      createdAt:     start,
      updatedAt:     start,
    });
    console.log(`   ✓ Auction: ${opts.card.name} — ends in ${opts.endsInHours}h — starting ₱${opts.startingPrice}`);
    return id;
  }

  // Auction 1 — Blastoise, 6 hrs left, 3 bids
  const a1 = await mkAuction({
    sellerId: seller1.id, card: get(pkm, 1),
    startingPrice: "3000.00", currentBid: "4100.00", bidIncrement: "200.00",
    reservePrice: "5000.00", endsInHours: 6,
    description: "Base Set Blastoise Holo. NM condition, kept in hard sleeve. Starting low — let the bids decide!",
  });

  // Auction 2 — Rayquaza VMAX, 1.5 hrs left (near snipe), 5 bids
  const a2 = await mkAuction({
    sellerId: seller2.id, card: get(pkm, 3),
    startingPrice: "2500.00", currentBid: "5600.00", bidIncrement: "100.00",
    endsInHours: 2,
    description: "Rayquaza VMAX Alternate Art. Near mint, fresh from booster box. Rare and highly sought after.",
  });

  // Auction 3 — One Piece Shanks, 18 hrs left, 1 bid
  const a3 = await mkAuction({
    sellerId: seller3.id, card: get(op, 2),
    startingPrice: "8000.00", currentBid: "8500.00", bidIncrement: "500.00",
    endsInHours: 18,
    description: "Shanks Secret Rare OP01. PSA-worthy condition. One of the most iconic cards in the set. No reserve.",
  });

  // Auction 4 — Mewtwo, 48 hrs left, no bids yet
  const a4 = await mkAuction({
    sellerId: seller2.id, card: get(pkm, 4),
    startingPrice: "1500.00", bidIncrement: "150.00",
    endsInHours: 48,
    description: "Fossil Mewtwo Holo NM. Perfect centering, flawless surface. Great for grading. Starting at a fair price.",
  });

  // ── Add bids ─────────────────────────────────────────────────────────────────
  console.log("\n💰 Adding bids...");

  if (buyer1 && buyer2 && buyer3) {
    // Auction 1 bids — 3 bids, buyer1 winning
    await db.insert(bids).values([
      { id: uid(), listingId: a1, bidderId: buyer2.id, amount: "3400.00", createdAt: ago(20) },
      { id: uid(), listingId: a1, bidderId: buyer3.id, amount: "3800.00", createdAt: ago(15) },
      { id: uid(), listingId: a1, bidderId: buyer1.id, amount: "4100.00", createdAt: ago(2)  },
    ]);
    console.log("   ✓ Auction 1 — 3 bids (Marco winning at ₱4,100)");

    // Auction 2 bids — 5 bids, buyer2 winning
    await db.insert(bids).values([
      { id: uid(), listingId: a2, bidderId: buyer1.id, amount: "2800.00", createdAt: ago(22) },
      { id: uid(), listingId: a2, bidderId: buyer3.id, amount: "3500.00", createdAt: ago(20) },
      { id: uid(), listingId: a2, bidderId: buyer1.id, amount: "4200.00", createdAt: ago(18) },
      { id: uid(), listingId: a2, bidderId: buyer2.id, amount: "5000.00", createdAt: ago(5)  },
      { id: uid(), listingId: a2, bidderId: buyer3.id, amount: "5600.00", createdAt: ago(1)  },
    ]);
    console.log("   ✓ Auction 2 — 5 bids (Kevin winning at ₱5,600)");

    // Auction 3 bids — 1 bid
    await db.insert(bids).values([
      { id: uid(), listingId: a3, bidderId: buyer1.id, amount: "8500.00", createdAt: ago(3) },
    ]);
    console.log("   ✓ Auction 3 — 1 bid (Marco at ₱8,500)");

    // Auction 4 — no bids (a4 unused intentionally)
    console.log(`   ✓ Auction 4 (${a4}) — no bids yet, open for first bid at ₱1,500`);
  }

  console.log("\n✅ Auction demo data added!\n");
  console.log("Active auctions:");
  console.log("  Blastoise Holo    — ₱4,100 current bid — ends in 6h");
  console.log("  Rayquaza VMAX AA  — ₱5,600 current bid — ends in 2h  ⚡ near snipe");
  console.log("  Shanks Secret     — ₱8,500 current bid — ends in 18h");
  console.log("  Mewtwo Fossil     — no bids            — ends in 48h");
}

main().catch(err => { console.error(err); process.exit(1); });
