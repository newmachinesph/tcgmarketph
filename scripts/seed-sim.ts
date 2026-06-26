/**
 * Simulation seed — wipes all user data, then creates:
 *   1 admin · 3 regular buyers · 3 sellers (with listings, transactions, ratings)
 *
 * Run:  npx tsx scripts/seed-sim.ts
 *
 * Passwords
 *   admin@tcgmarket.ph  →  Admin1234!
 *   everyone else       →  Test1234!
 */

// ── Load .env.local ──────────────────────────────────────────────────────────
import { readFileSync } from "fs";
import { join }         from "path";
try {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* rely on existing env */ }

import { createId }     from "@paralleldrive/cuid2";
import { hashPassword } from "better-auth/crypto";

import { db }           from "../src/lib/db";
import {
  user, account, session, verification, phoneOtp, kycVerification,
} from "../src/db/schema/auth";
import {
  cardCatalog, userCollection, collectionFolders, userWishlist,
} from "../src/db/schema/cards";
import {
  listings, listingPhotos, bids, listingViews,
} from "../src/db/schema/listings";
import { transactions, meetupProposals } from "../src/db/schema/transactions";
import { offers }           from "../src/db/schema/offers";
import { ratings }          from "../src/db/schema/ratings";
import { savedSearches, priceAlerts } from "../src/db/schema/searches";
import { conversations, messages }    from "../src/db/schema/messages";
import { notifications }  from "../src/db/schema/notifications";
import { reports }        from "../src/db/schema/reports";
import { blockedUsers }   from "../src/db/schema/blocks";

// ── Helpers ──────────────────────────────────────────────────────────────────

const uid  = () => createId();
const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const ago  = (n: number) => new Date(Date.now() - n * 86_400_000);

async function mkUser(opts: {
  id:               string;
  name:             string;
  displayName:      string;
  email:            string;
  password:         string;
  city?:            string;
  bio?:             string;
  games?:           string;
  phone?:           string;
  phoneVerified?:   boolean;
  kycStatus?:       "none" | "pending" | "verified" | "rejected";
  sellerEnabled?:   boolean;
  subscriptionTier?: "free" | "power_seller";
  isAdmin?:         boolean;
  reputationScore?: number;
}) {
  const hash = await hashPassword(opts.password);

  await db.insert(user).values({
    id:               opts.id,
    name:             opts.name,
    displayName:      opts.displayName,
    email:            opts.email,
    emailVerified:    true,
    city:             opts.city,
    bio:              opts.bio,
    games:            opts.games,
    phone:            opts.phone,
    phoneVerified:    opts.phoneVerified ?? false,
    kycStatus:        opts.kycStatus ?? "none",
    sellerEnabled:    opts.sellerEnabled ?? false,
    subscriptionTier: opts.subscriptionTier ?? "free",
    isAdmin:          opts.isAdmin ?? false,
    reputationScore:  opts.reputationScore ?? 0,
    preferredCurrency: "PHP",
  });

  await db.insert(account).values({
    id:         uid(),
    userId:     opts.id,
    accountId:  opts.id,
    providerId: "credential",
    password:   hash,
  });
}

// ── 1. WIPE (FK-safe order) ──────────────────────────────────────────────────

async function wipe() {
  console.log("🗑  Wiping user data...");

  await db.delete(ratings);
  await db.delete(meetupProposals);
  await db.delete(offers);
  await db.delete(transactions);
  await db.delete(bids);
  await db.delete(priceAlerts);
  await db.delete(listingViews);
  await db.delete(listingPhotos);
  await db.delete(listings);
  await db.delete(reports);
  await db.delete(blockedUsers);
  await db.delete(savedSearches);
  await db.delete(notifications);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(userCollection);
  await db.delete(collectionFolders);
  await db.delete(userWishlist);
  await db.delete(kycVerification);
  await db.delete(phoneOtp);
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);

  console.log("   Done.\n");
}

// ── 2. SEED ──────────────────────────────────────────────────────────────────

async function seed() {
  // ── User IDs ─────────────────────────────────────────────────────────────
  const ADMIN = uid();
  const MARCO = uid(); // buyer, Pokemon, Manila
  const ARIA  = uid(); // buyer, One Piece, Cebu
  const KEVIN = uid(); // buyer, both games, Davao
  const JOVEN = uid(); // seller, Pokemon, Makati, verified
  const LIAN  = uid(); // seller, One Piece, QC, verified
  const MIRA  = uid(); // power seller, both, BGC, verified

  // ── Users ────────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  await mkUser({
    id: ADMIN, name: "Admin", displayName: "Admin",
    email: "admin@tcgmarket.ph", password: "Admin1234!",
    isAdmin: true, city: "Manila",
    bio: "Platform administrator.",
    games: "pokemon,one_piece",
  });

  await mkUser({
    id: MARCO, name: "Marco Santos", displayName: "Marco",
    email: "marco@test.com", password: "Test1234!",
    city: "Manila", games: "pokemon",
    bio: "Pokémon collector since Gen 1. Always hunting Base Set holos.",
  });

  await mkUser({
    id: ARIA, name: "Aria dela Cruz", displayName: "Aria",
    email: "aria@test.com", password: "Test1234!",
    city: "Cebu", games: "one_piece",
    bio: "Big One Piece fan. Looking for alt-art Luffys.",
  });

  await mkUser({
    id: KEVIN, name: "Kevin Reyes", displayName: "Kev",
    email: "kevin@test.com", password: "Test1234!",
    city: "Davao", games: "pokemon,one_piece",
    bio: "Casual player and collector. Into both Pokémon and One Piece.",
  });

  await mkUser({
    id: JOVEN, name: "Joven Tan", displayName: "JovenCards",
    email: "joven@test.com", password: "Test1234!",
    city: "Makati", games: "pokemon",
    bio: "Professional Pokémon card reseller. 5+ years in the hobby. All cards guaranteed authentic.",
    phone: "+639171234001", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 23,
  });

  await mkUser({
    id: LIAN, name: "Lian Buenaventura", displayName: "LianTCG",
    email: "lian@test.com", password: "Test1234!",
    city: "Quezon City", games: "one_piece",
    bio: "One Piece TCG specialist. Fast meetups in QC area. Legit seller, check my ratings!",
    phone: "+639181234002", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 15,
  });

  await mkUser({
    id: MIRA, name: "Mira Espinoza", displayName: "MiraTCG",
    email: "mira@test.com", password: "Test1234!",
    city: "BGC, Taguig", games: "pokemon,one_piece",
    bio: "Power seller — Pokemon & One Piece. BGC meetups preferred. Over 40 successful deals.",
    phone: "+639191234003", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true,
    subscriptionTier: "power_seller", reputationScore: 41,
  });

  console.log("   Created 7 users.\n");

  // ── Card catalog ─────────────────────────────────────────────────────────
  console.log("🃏 Fetching card catalog...");

  const cards = await db
    .select({ id: cardCatalog.id, name: cardCatalog.name, game: cardCatalog.game, marketPrice: cardCatalog.marketPrice })
    .from(cardCatalog);

  if (cards.length === 0) {
    console.warn("   ⚠ card_catalog is empty — run `npx tsx scripts/seed-cards.ts` first!\n   Skipping listings.\n");
    return;
  }

  const pkm = cards.filter(c => c.game === "pokemon");
  const op  = cards.filter(c => c.game === "one_piece");
  const get = <T>(arr: T[], i: number) => arr[i % arr.length];

  console.log(`   Found ${pkm.length} Pokémon cards, ${op.length} One Piece cards.\n`);

  // ── Listings ─────────────────────────────────────────────────────────────
  console.log("📋 Creating listings...");

  async function mkListing(opts: {
    sellerId:    string;
    card:        { id: string };
    price:       string;
    condition?:  "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged";
    description?: string;
    quantity?:   number;
    daysOld?:    number;
  }) {
    const id = uid();
    const createdAt = ago(opts.daysOld ?? 0);
    await db.insert(listings).values({
      id,
      sellerId:    opts.sellerId,
      cardId:      opts.card.id,
      condition:   opts.condition ?? "near_mint",
      price:       opts.price,
      quantity:    opts.quantity ?? 1,
      description: opts.description,
      status:      "active",
      expiresAt:   new Date(createdAt.getTime() + 30 * 86_400_000),
      createdAt,
      updatedAt:   createdAt,
    });
    return id;
  }

  // Joven – Pokemon specialist
  const jL1 = await mkListing({
    sellerId: JOVEN, card: get(pkm, 0), price: "19500.00",
    description: "Shadowless Base Set Charizard. Near mint — no scratches, crisp corners. Stored in sleeve since pulled.",
    daysOld: 12,
  });
  const jL2 = await mkListing({
    sellerId: JOVEN, card: get(pkm, 2), price: "4200.00",
    description: "Base Set Mewtwo holo. Light play on back, front is flawless. Great for framing.",
    daysOld: 7,
  });
  const jL3 = await mkListing({
    sellerId: JOVEN, card: get(pkm, 4), price: "4500.00", condition: "lightly_played",
    description: "Venusaur Base Set holo. LP — minor whitening on back edges. Perfect for a complete Base Set.",
    daysOld: 3,
  });
  await mkListing({
    sellerId: JOVEN, card: get(pkm, 5), price: "2000.00",
    description: "Fossil Gengar NM. No bends, no scratches. One of my favorites in the set.",
    daysOld: 1,
  });

  // Lian – One Piece specialist
  const lL1 = await mkListing({
    sellerId: LIAN, card: get(op, 0), price: "350.00",
    description: "Luffy Leader OP01-001. NM condition fresh from booster. Ready for competitive play.",
    daysOld: 5,
  });
  await mkListing({
    sellerId: LIAN, card: get(op, 1), price: "120.00",
    description: "Roronoa Zoro OP01-002. NM, pulled last week. Selling extras from my box opening.",
    daysOld: 5,
  });
  await mkListing({
    sellerId: LIAN, card: get(op, 2), price: "90.00", condition: "lightly_played",
    description: "Nami Romance Dawn. LP from playing but still looks great.",
    daysOld: 2,
  });

  // Mira – Power seller, both games
  const mL1 = await mkListing({
    sellerId: MIRA, card: get(pkm, 3), price: "5800.00",
    description: "Blastoise Base Set holo. PSA-worthy condition. Stored in toploader from the start.",
    daysOld: 8,
  });
  const mL2 = await mkListing({
    sellerId: MIRA, card: get(pkm, 1), price: "600.00", quantity: 3,
    description: "Pikachu Base Set x3 copies. All NM. Great for collector sets.",
    daysOld: 8,
  });
  const mL3 = await mkListing({
    sellerId: MIRA, card: get(op, 0), price: "300.00",
    description: "Luffy Leader OP01-001. NM pulled from sealed box. Can meetup BGC any day.",
    daysOld: 4,
  });
  await mkListing({
    sellerId: MIRA, card: get(op, 3), price: "85.00", quantity: 5,
    description: "One Piece commons x5. All NM, variety from OP01 set.",
    daysOld: 2,
  });

  console.log("   Created 11 listings.\n");

  // ── Transactions ─────────────────────────────────────────────────────────
  console.log("🤝 Creating transactions & ratings...");

  // Marco bought Charizard from Joven → completed
  const t1 = uid();
  await db.insert(transactions).values({
    id: t1, listingId: jL1, buyerId: MARCO, sellerId: JOVEN,
    agreedPrice: "19500.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: ago(10), updatedAt: ago(8),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t1, raterId: MARCO, rateeId: JOVEN, score: 5,
      comment: "Super legit! Card exactly as described. Fast transaction. Highly recommend!" },
    { id: uid(), transactionId: t1, raterId: JOVEN, rateeId: MARCO, score: 5,
      comment: "Smooth buyer, showed up on time, exact change. A+" },
  ]);

  // Kevin bought Luffy from Lian → completed
  const t2 = uid();
  await db.insert(transactions).values({
    id: t2, listingId: lL1, buyerId: KEVIN, sellerId: LIAN,
    agreedPrice: "350.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: ago(4), updatedAt: ago(3),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t2, raterId: KEVIN, rateeId: LIAN, score: 5,
      comment: "Legit card, great seller. Will buy again!" },
    { id: uid(), transactionId: t2, raterId: LIAN, rateeId: KEVIN, score: 4,
      comment: "Good buyer, slight delay but overall ok." },
  ]);

  // Aria bought Blastoise from Mira → completed
  const t3 = uid();
  await db.insert(transactions).values({
    id: t3, listingId: mL1, buyerId: ARIA, sellerId: MIRA,
    agreedPrice: "5800.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: ago(6), updatedAt: ago(5),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t3, raterId: ARIA, rateeId: MIRA, score: 5,
      comment: "Mira is an amazing seller. Card was perfect. Highly trusted!" },
    { id: uid(), transactionId: t3, raterId: MIRA, rateeId: ARIA, score: 5,
      comment: "Wonderful buyer, fast and reliable!" },
  ]);

  // Aria + Mira → agreed, awaiting meetup (Luffy OP01)
  const t4 = uid();
  await db.insert(transactions).values({
    id: t4, listingId: mL3, buyerId: ARIA, sellerId: MIRA,
    agreedPrice: "300.00", quantity: 1, method: "cash_meetup", status: "agreed",
    createdAt: ago(1), updatedAt: ago(1),
  });

  console.log("   4 transactions, 6 ratings done.\n");

  // ── Offers ───────────────────────────────────────────────────────────────
  console.log("💬 Creating offers...");

  // Marco → pending offer on Mewtwo from Joven
  const o1 = uid();
  await db.insert(offers).values({
    id: o1, listingId: jL2, buyerId: MARCO, sellerId: JOVEN,
    offeredPrice: "3800.00",
    message: "Hi! Can you do 3800? Ready to meet anytime in Makati.",
    status: "pending", expiresAt: days(2),
  });

  // Kevin → countered offer on 3x Pikachu from Mira
  const o2 = uid();
  await db.insert(offers).values({
    id: o2, listingId: mL2, buyerId: KEVIN, sellerId: MIRA,
    offeredPrice: "1500.00", message: "All 3 Pikachus for 1500?",
    counterPrice: "1700.00", counterMessage: "Best I can do is 1700 for all 3 — they're all NM.",
    status: "countered", expiresAt: days(1),
  });

  console.log("   2 offers done.\n");

  // ── Notifications ────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");

  await db.insert(notifications).values([
    {
      id: uid(), userId: KEVIN, type: "offer_countered",
      title: "Offer countered — Pikachu ×3",
      body: "Mira countered your ₱1,500 offer with ₱1,700. Respond before it expires.",
      link: `/offers/${o2}`,
      readAt: null, createdAt: ago(1),
    },
    {
      id: uid(), userId: JOVEN, type: "offer_received",
      title: "New offer on Mewtwo",
      body: "Marco offered ₱3,800 on your Mewtwo Base Set listing.",
      link: `/offers/${o1}`,
      readAt: null, createdAt: ago(1),
    },
    {
      id: uid(), userId: MIRA, type: "transaction_agreed",
      title: "Deal confirmed — Monkey D. Luffy",
      body: "Aria confirmed the deal. Arrange your meetup in BGC.",
      link: `/transactions/${t4}`,
      readAt: null, createdAt: ago(1),
    },
    {
      id: uid(), userId: MARCO, type: "transaction_completed",
      title: "Deal complete — Charizard",
      body: "Your Charizard purchase from JovenCards is marked complete. Leave a rating!",
      link: `/transactions/${t1}`,
      readAt: ago(8), createdAt: ago(8),
    },
    {
      id: uid(), userId: ARIA, type: "transaction_completed",
      title: "Deal complete — Blastoise",
      body: "Your Blastoise purchase from MiraTCG is complete. Don't forget to rate!",
      link: `/transactions/${t3}`,
      readAt: ago(5), createdAt: ago(5),
    },
  ]);

  console.log("   5 notifications done.\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await wipe();
  await seed();

  console.log("✅ Simulation seed complete!\n");
  console.log("── Credentials ───────────────────────────────────────────────");
  console.log("  admin@tcgmarket.ph   Admin1234!   [Admin]");
  console.log("  marco@test.com       Test1234!    [Buyer — Manila, Pokémon]");
  console.log("  aria@test.com        Test1234!    [Buyer — Cebu, One Piece]");
  console.log("  kevin@test.com       Test1234!    [Buyer — Davao, Both]");
  console.log("  joven@test.com       Test1234!    [Seller — Makati, Pokémon ✓]");
  console.log("  lian@test.com        Test1234!    [Seller — QC, One Piece ✓]");
  console.log("  mira@test.com        Test1234!    [Power Seller — BGC, Both ✓]");
  console.log("──────────────────────────────────────────────────────────────\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
