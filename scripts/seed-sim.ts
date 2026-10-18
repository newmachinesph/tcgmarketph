/**
 * Simulation seed — wipes all user data, then creates realistic sample data:
 *   1 admin · 6 sellers · 6 buyers
 *   32 fixed-price listings · 8 auction listings · 42 bids
 *   12 transactions · 24 ratings · 4 offers · 3 conversations · 8 notifications
 *
 * Requires: card_catalog seeded first → npx tsx scripts/seed-cards.ts
 * Run:      npx tsx scripts/seed-sim.ts
 *
 * Passwords (set in env, no defaults)
 *   SEED_ADMIN_PASSWORD  →  admin@tcgmarket.ph
 *   SEED_USER_PASSWORD   →  everyone else
 */

// ── Load .env.local ───────────────────────────────────────────────────────────
import { readFileSync } from "fs";
import { join }         from "path";
try {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* rely on existing env */ }

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
const SEED_USER_PASSWORD  = process.env.SEED_USER_PASSWORD ?? "";
if (!SEED_ADMIN_PASSWORD || !SEED_USER_PASSWORD) {
  throw new Error("Set SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD before running the simulation seed.");
}

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
import { toListingSlug }  from "../src/lib/utils/slug";

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid   = () => createId();
const days  = (n: number) => new Date(Date.now() + n * 86_400_000);
const dago  = (n: number) => new Date(Date.now() - n * 86_400_000);
const hrs   = (n: number) => new Date(Date.now() + n * 3_600_000);
const hago  = (n: number) => new Date(Date.now() - n * 3_600_000);
const mago  = (n: number) => new Date(Date.now() - n * 60_000);

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

// ── 1. WIPE ───────────────────────────────────────────────────────────────────

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

// ── 2. SEED ───────────────────────────────────────────────────────────────────

async function seed() {

  // ── User IDs ───────────────────────────────────────────────────────────────
  const ADMIN  = uid();
  // Original buyers
  const MARCO  = uid(); // buyer  — Manila,    Pokémon
  const ARIA   = uid(); // buyer  — Cebu,      One Piece
  const KEVIN  = uid(); // buyer  — Davao,     both
  const REX    = uid(); // buyer  — Pampanga,  both
  // New buyers
  const CARLO  = uid(); // buyer  — Pasig,     Pokémon
  const NINA   = uid(); // buyer  — Parañaque, One Piece
  // Original sellers
  const JOVEN  = uid(); // seller — Makati,    Pokémon,   verified
  const LIAN   = uid(); // seller — QC,        One Piece, verified
  const MIRA   = uid(); // power  — BGC,       both,      verified
  const DANI   = uid(); // seller — Iloilo,    both,      verified
  // New sellers
  const BONG   = uid(); // seller — Mandaluyong, both,    verified
  const CLAIRE = uid(); // seller — Batangas,    Pokémon, verified
  const PAULO  = uid(); // seller — Alabang,     One Piece, verified

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  await mkUser({
    id: ADMIN, name: "Admin", displayName: "Admin",
    email: "admin@tcgmarket.ph", password: SEED_ADMIN_PASSWORD,
    isAdmin: true, city: "Manila",
    bio: "Platform administrator.",
    games: "pokemon,one_piece",
  });
  await mkUser({
    id: MARCO, name: "Marco Santos", displayName: "Marco",
    email: "marco@test.com", password: SEED_USER_PASSWORD,
    city: "Manila", games: "pokemon",
    bio: "Pokémon collector since Gen 1. Always hunting Base Set holos.",
  });
  await mkUser({
    id: ARIA, name: "Aria dela Cruz", displayName: "Aria",
    email: "aria@test.com", password: SEED_USER_PASSWORD,
    city: "Cebu", games: "one_piece",
    bio: "Big One Piece fan. Looking for alt-art Luffys and Shanks.",
  });
  await mkUser({
    id: KEVIN, name: "Kevin Reyes", displayName: "Kev",
    email: "kevin@test.com", password: SEED_USER_PASSWORD,
    city: "Davao", games: "pokemon,one_piece",
    bio: "Casual player and collector. Into both Pokémon and One Piece.",
  });
  await mkUser({
    id: REX, name: "Rex Villanueva", displayName: "RexV",
    email: "rex@test.com", password: SEED_USER_PASSWORD,
    city: "Angeles, Pampanga", games: "pokemon,one_piece",
    bio: "Competitive player chasing tournament staples and chase rares.",
  });
  await mkUser({
    id: CARLO, name: "Carlo Mendoza", displayName: "CarloM",
    email: "carlo@test.com", password: SEED_USER_PASSWORD,
    city: "Pasig", games: "pokemon",
    bio: "Gen 2 era collector — Gold & Silver forever. Looking for E-Card and Neo sets.",
  });
  await mkUser({
    id: NINA, name: "Nina Castillo", displayName: "NinaTCG",
    email: "nina@test.com", password: SEED_USER_PASSWORD,
    city: "Parañaque", games: "one_piece",
    bio: "One Piece TCG newcomer. Building my first Luffy deck. Happy to trade!",
  });
  await mkUser({
    id: JOVEN, name: "Joven Tan", displayName: "JovenCards",
    email: "joven@test.com", password: SEED_USER_PASSWORD,
    city: "Makati", games: "pokemon",
    bio: "Professional Pokémon card reseller. 5+ years in the hobby. All cards guaranteed authentic.",
    phone: "+639171234001", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 28,
  });
  await mkUser({
    id: LIAN, name: "Lian Buenaventura", displayName: "LianTCG",
    email: "lian@test.com", password: SEED_USER_PASSWORD,
    city: "Quezon City", games: "one_piece",
    bio: "One Piece TCG specialist. Fast meetups in QC area. Legit seller, check my ratings!",
    phone: "+639181234002", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 21,
  });
  await mkUser({
    id: MIRA, name: "Mira Espinoza", displayName: "MiraTCG",
    email: "mira@test.com", password: SEED_USER_PASSWORD,
    city: "BGC, Taguig", games: "pokemon,one_piece",
    bio: "Power seller — Pokémon & One Piece. BGC meetups preferred. 47+ successful deals.",
    phone: "+639191234003", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true,
    subscriptionTier: "power_seller", reputationScore: 47,
  });
  await mkUser({
    id: DANI, name: "Danielle Ramos", displayName: "DaniRamos",
    email: "dani@test.com", password: SEED_USER_PASSWORD,
    city: "Iloilo City", games: "pokemon,one_piece",
    bio: "Collector from the Visayas. Specialising in vintage Pokémon and One Piece tournament singles.",
    phone: "+639201234004", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 12,
  });
  await mkUser({
    id: BONG, name: "Bong Aquino", displayName: "BongTCG",
    email: "bong@test.com", password: SEED_USER_PASSWORD,
    city: "Mandaluyong", games: "pokemon,one_piece",
    bio: "Both games, great deals. Based in Mandaluyong — EDSA meetup spots preferred.",
    phone: "+639211234005", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 15,
  });
  await mkUser({
    id: CLAIRE, name: "Claire Ocampo", displayName: "ClaireCards",
    email: "claire@test.com", password: SEED_USER_PASSWORD,
    city: "Batangas", games: "pokemon",
    bio: "Vintage Pokémon specialist. Batangas seller — ships nationwide via courier. All items authenticated.",
    phone: "+639221234006", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 19,
  });
  await mkUser({
    id: PAULO, name: "Paulo Reyes", displayName: "PauloOP",
    email: "paulo@test.com", password: SEED_USER_PASSWORD,
    city: "Alabang, Muntinlupa", games: "one_piece",
    bio: "One Piece TCG only. Competitive player and collector. South Metro Manila meetup area.",
    phone: "+639231234007", phoneVerified: true,
    kycStatus: "verified", sellerEnabled: true, reputationScore: 8,
  });

  console.log("   Created 14 users.\n");

  // ── Card catalog ───────────────────────────────────────────────────────────
  console.log("🃏 Fetching card catalog...");

  const cards = await db
    .select({ id: cardCatalog.id, name: cardCatalog.name, game: cardCatalog.game, marketPrice: cardCatalog.marketPrice })
    .from(cardCatalog);

  if (cards.length === 0) {
    console.warn("   ⚠ card_catalog is empty — run `npx tsx scripts/seed-cards.ts` first!\n");
    return;
  }

  const pkm = cards.filter(c => c.game === "pokemon");
  const op  = cards.filter(c => c.game === "one_piece");

  const pkmByName = (n: string) => pkm.find(c => c.name.includes(n)) ?? pkm[0];
  const opByName  = (n: string) => op.find(c => c.name.includes(n))  ?? op[0];

  const C_CHARIZARD = pkmByName("Charizard");
  const C_PIKACHU   = pkmByName("Pikachu");
  const C_MEWTWO    = pkmByName("Mewtwo");
  const C_BLASTOISE = pkmByName("Blastoise");
  const C_VENUSAUR  = pkmByName("Venusaur");
  const C_GENGAR    = pkmByName("Gengar");
  const C_LUFFY     = opByName("Luffy");
  const C_ZORO      = opByName("Zoro");
  const C_NAMI      = opByName("Nami");
  const C_ACE       = opByName("Ace");
  const C_LAW       = opByName("Law");

  console.log(`   Found ${pkm.length} Pokémon, ${op.length} One Piece cards.\n`);

  // ── Helper: create fixed-price listing ────────────────────────────────────

  async function mkListing(opts: {
    id?:         string;
    sellerId:    string;
    card:        { id: string; name: string };
    price:       string;
    condition?:  "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged";
    description?: string;
    quantity?:   number;
    daysOld?:   number;
    isFoil?:     boolean;
    isFirstEdition?: boolean;
  }) {
    const id = opts.id ?? uid();
    const slug = toListingSlug(opts.card.name, id);
    const createdAt = dago(opts.daysOld ?? 0);
    await db.insert(listings).values({
      id,
      sellerId:    opts.sellerId,
      cardId:      opts.card.id,
      type:        "fixed_price",
      condition:   opts.condition ?? "near_mint",
      price:       opts.price,
      quantity:    opts.quantity ?? 1,
      description: opts.description,
      slug,
      status:      "active",
      isFoil:      opts.isFoil ?? false,
      isFirstEdition: opts.isFirstEdition ?? false,
      expiresAt:   new Date(createdAt.getTime() + 30 * 86_400_000),
      createdAt,
      updatedAt:   createdAt,
    });
    return id;
  }

  // ── Helper: create auction listing ────────────────────────────────────────

  async function mkAuction(opts: {
    sellerId:       string;
    card:           { id: string; name: string };
    startingPrice:  string;
    currentBid?:    string;
    bidIncrement:   string;
    reservePrice?:  string;
    endsInHours:    number;
    condition?:     "near_mint" | "lightly_played";
    description:    string;
  }) {
    const id    = uid();
    const slug  = toListingSlug(opts.card.name, id);
    const start = hago(24);
    const end   = hrs(opts.endsInHours);
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
      slug,
      status:        "active",
      expiresAt:     end,
      createdAt:     start,
      updatedAt:     start,
    });
    console.log(`   ✓ Auction: ${opts.card.name} — ends in ${opts.endsInHours}h — ₱${opts.currentBid ?? opts.startingPrice}`);
    return id;
  }

  // ── Fixed-price listings ───────────────────────────────────────────────────
  console.log("📋 Creating fixed-price listings...");

  // Joven — Pokémon specialist (Makati)
  const jL1 = await mkListing({
    sellerId: JOVEN, card: C_CHARIZARD, price: "19500.00",
    description: "Shadowless Base Set Charizard. Near mint — no scratches, crisp corners. Stored in sleeve from the moment it was pulled. A true grail piece.",
    daysOld: 12,
  });
  const jL2 = await mkListing({
    sellerId: JOVEN, card: C_MEWTWO, price: "4200.00", condition: "lightly_played",
    description: "Base Set Mewtwo holo. Light play on back only, front is flawless. Perfect for display or completing a Base Set.",
    daysOld: 7,
  });
  const jL3 = await mkListing({
    sellerId: JOVEN, card: C_VENUSAUR, price: "4500.00", condition: "lightly_played",
    description: "Venusaur Base Set holo. LP — minor whitening on back edges. Perfect for anyone building a complete Base Set on a budget.",
    daysOld: 3,
  });
  await mkListing({
    sellerId: JOVEN, card: C_GENGAR, price: "2000.00",
    description: "Fossil Gengar NM. No bends, no scratches. Kept in toploader since pulled. One of my favourites from the set.",
    daysOld: 1,
  });
  await mkListing({
    sellerId: JOVEN, card: C_PIKACHU, price: "1200.00", quantity: 2,
    description: "Base Set Pikachu ×2. Both NM. Perfect for framing side by side or gifting to a new collector.",
    daysOld: 4,
  });

  // Lian — One Piece specialist (QC)
  const lL1 = await mkListing({
    sellerId: LIAN, card: C_LUFFY, price: "350.00",
    description: "Luffy Leader OP01-001. NM condition, fresh from booster. Ready for competitive play.",
    daysOld: 5,
  });
  await mkListing({
    sellerId: LIAN, card: C_ZORO, price: "120.00",
    description: "Roronoa Zoro OP01-002. NM, pulled last week. Selling extras from my box opening.",
    daysOld: 5,
  });
  await mkListing({
    sellerId: LIAN, card: C_NAMI, price: "90.00", condition: "lightly_played",
    description: "Nami Romance Dawn. LP from light play but still looks great. Good for set completion.",
    daysOld: 2,
  });
  await mkListing({
    sellerId: LIAN, card: C_ACE, price: "480.00",
    description: "Portgas D. Ace Leader OP02-001. NM, never played. Perfect centering and surface. Must-have for One Piece fans.",
    daysOld: 6,
  });
  const lL5 = await mkListing({
    sellerId: LIAN, card: C_LAW, price: "2200.00",
    description: "Trafalgar Law Secret Rare OP02-094. NM. Stunning artwork — pulled from a fresh box. One of the best-looking cards in the game.",
    daysOld: 3,
  });

  // Mira — Power seller, both games (BGC)
  const mL1 = await mkListing({
    sellerId: MIRA, card: C_BLASTOISE, price: "5800.00",
    description: "Blastoise Base Set holo. NM — PSA-worthy centering and surface. Stored in toploader from day one. One of the cleanest copies I've had.",
    daysOld: 8,
  });
  const mL2 = await mkListing({
    sellerId: MIRA, card: C_PIKACHU, price: "600.00", quantity: 3,
    description: "Pikachu Base Set ×3. All NM. Great starter set or trio for display. Can sell individually — DM me.",
    daysOld: 8,
  });
  const mL3 = await mkListing({
    sellerId: MIRA, card: C_LUFFY, price: "300.00",
    description: "Luffy Leader OP01-001. NM pulled from sealed box. Can meetup BGC any day of the week.",
    daysOld: 4,
  });
  await mkListing({
    sellerId: MIRA, card: C_GENGAR, price: "1800.00", condition: "lightly_played",
    description: "Fossil Gengar. LP — minor edge wear from casual play. Great price for a classic card.",
    daysOld: 2,
  });
  await mkListing({
    sellerId: MIRA, card: C_LAW, price: "2300.00",
    description: "Trafalgar Law Secret Rare OP02-094. NM. Pulled this myself — kept in sleeve since. Firm price, no lowballs.",
    daysOld: 5,
  });

  // Dani — Both games (Iloilo)
  await mkListing({
    sellerId: DANI, card: C_CHARIZARD, price: "8500.00", condition: "moderately_played",
    description: "Charizard Base Set. MP — some surface scratches and edge wear from years of play, but still a real Charizard. Priced accordingly.",
    daysOld: 10,
  });
  await mkListing({
    sellerId: DANI, card: C_ZORO, price: "110.00",
    description: "Zoro OP01-002 NM. Pulled two from the same pack. Selling the extra.",
    daysOld: 3,
  });
  await mkListing({
    sellerId: DANI, card: C_ACE, price: "450.00",
    description: "Portgas D. Ace Leader OP02-001. NM. Fresh from sealed booster box. Iloilo meetup or can coordinate GCash + courier.",
    daysOld: 7,
  });
  await mkListing({
    sellerId: DANI, card: C_MEWTWO, price: "3800.00",
    description: "Base Set Mewtwo Holo. NM — excellent centering. One of the cleanest Base Set Mewtwo you'll find.",
    daysOld: 2,
  });
  await mkListing({
    sellerId: DANI, card: C_VENUSAUR, price: "3500.00", condition: "lightly_played",
    description: "Venusaur Base Set Holo. LP — light whitening on edges but face is flawless. Great addition to any vintage collection.",
    daysOld: 5,
  });

  // Bong — Both games (Mandaluyong)
  await mkListing({
    sellerId: BONG, card: C_GENGAR, price: "1900.00",
    description: "Fossil Gengar NM. Beautifully preserved — stored in sleeve and toploader since day one. Mandaluyong meetup or can negotiate courier.",
    daysOld: 6,
  });
  await mkListing({
    sellerId: BONG, card: C_BLASTOISE, price: "5500.00", condition: "lightly_played",
    description: "Blastoise Base Set holo. LP — light surface wear only. Great for a complete Base Set holo collection. EDSA meetup spots.",
    daysOld: 4,
  });
  const bL3 = await mkListing({
    sellerId: BONG, card: C_LUFFY, price: "280.00",
    description: "Luffy Leader OP01-001 NM. Surplus from a box opening. Quick meetup in Mandaluyong.",
    daysOld: 2,
  });
  await mkListing({
    sellerId: BONG, card: C_NAMI, price: "80.00",
    description: "Nami Romance Dawn NM. Extras from my booster box. Great filler for set completion or for Nami fans.",
    daysOld: 3,
  });

  // Claire — Pokémon specialist (Batangas)
  const cL1 = await mkListing({
    sellerId: CLAIRE, card: C_CHARIZARD, price: "12000.00", condition: "lightly_played",
    description: "Base Set Charizard LP. Very minimal wear — light scratch on back, front is near perfect. Price reflects condition accurately.",
    daysOld: 8,
  });
  await mkListing({
    sellerId: CLAIRE, card: C_PIKACHU, price: "1100.00",
    description: "Base Set Pikachu NM. Perfect copy — yellow is vivid, no edge wear. Can ship nationwide with proper packaging.",
    daysOld: 5,
  });
  await mkListing({
    sellerId: CLAIRE, card: C_MEWTWO, price: "3700.00", condition: "near_mint",
    description: "Base Set Mewtwo NM. Gorgeous specimen — sharp corners, no scratches. One of the most iconic Pokémon cards ever printed.",
    daysOld: 3,
  });
  await mkListing({
    sellerId: CLAIRE, card: C_VENUSAUR, price: "4200.00",
    description: "Venusaur Base Set NM. Pulled from a collection I acquired — genuinely near mint. Batangas meetup or JRS courier.",
    daysOld: 7,
  });

  // Paulo — One Piece specialist (Alabang)
  await mkListing({
    sellerId: PAULO, card: C_LUFFY, price: "320.00",
    description: "Luffy Leader OP01-001 NM. Brand new from sealed booster. South Manila meetup (Alabang/Festival Mall).",
    daysOld: 4,
  });
  await mkListing({
    sellerId: PAULO, card: C_ZORO, price: "115.00",
    description: "Roronoa Zoro NM. Extra copy from my box. Competitive staple — grab it at a great price.",
    daysOld: 3,
  });
  const pL3 = await mkListing({
    sellerId: PAULO, card: C_LAW, price: "2100.00",
    description: "Trafalgar Law Secret Rare OP02-094. NM. One of the most beautiful One Piece cards printed — pulled fresh, sleeved immediately.",
    daysOld: 6,
  });
  await mkListing({
    sellerId: PAULO, card: C_ACE, price: "460.00",
    description: "Portgas D. Ace Leader OP02-001. NM. Great condition, ready for competitive play or collection. Alabang meetup preferred.",
    daysOld: 5,
  });

  console.log("   Created 32 fixed-price listings.\n");

  // ── Auction listings ───────────────────────────────────────────────────────
  console.log("🔨 Creating auction listings...");

  // A1 — Charizard, ending in 45 min, 8 bids, HOT
  const A1 = await mkAuction({
    sellerId: JOVEN, card: C_CHARIZARD,
    startingPrice: "15000.00", currentBid: "19000.00", bidIncrement: "500.00",
    reservePrice: "18000.00",
    endsInHours: 0.75,
    description: "Base Set Charizard — starting low, let the bids decide. NM condition, no scratches. Stored in hard sleeve. This is the real deal.",
  });

  // A2 — Blastoise, ending in 2 hrs, 5 bids
  const A2 = await mkAuction({
    sellerId: MIRA, card: C_BLASTOISE,
    startingPrice: "4500.00", currentBid: "6800.00", bidIncrement: "200.00",
    endsInHours: 2,
    description: "Blastoise Base Set Holo. NM — crisp edges, no whitening. Stored in toploader. Starting below market — I want it to go to a good home.",
  });

  // A3 — Venusaur, ending in 6 hrs, 6 bids
  const A3 = await mkAuction({
    sellerId: JOVEN, card: C_VENUSAUR,
    startingPrice: "3000.00", currentBid: "5200.00", bidIncrement: "200.00",
    endsInHours: 6,
    description: "Venusaur Base Set Holo. NM — perfect centering. One of the cleanest I've owned. Complete the original three starters.",
  });

  // A4 — Trafalgar Law Secret Rare, ending in 10 hrs, 4 bids
  const A4 = await mkAuction({
    sellerId: LIAN, card: C_LAW,
    startingPrice: "1500.00", currentBid: "2600.00", bidIncrement: "200.00",
    endsInHours: 10,
    description: "Trafalgar Law Secret Rare OP02-094. NM — absolutely stunning card. Pulled fresh, kept sleeved. One of the most iconic arts in One Piece TCG.",
  });

  // A5 — Pikachu (×2 lot), ending in 20 hrs, 3 bids
  const A5 = await mkAuction({
    sellerId: MIRA, card: C_PIKACHU,
    startingPrice: "400.00", currentBid: "750.00", bidIncrement: "50.00",
    endsInHours: 20,
    description: "Pikachu Base Set lot — 2 copies, both NM. Perfect for gifting or displaying. Starting low for a quick sale.",
  });

  // A6 — Ace OP02-001, ending in 32 hrs, 2 bids
  const A6 = await mkAuction({
    sellerId: LIAN, card: C_ACE,
    startingPrice: "350.00", currentBid: "500.00", bidIncrement: "50.00",
    endsInHours: 32,
    description: "Portgas D. Ace Leader OP02-001. NM condition, never played. Perfect centering. Ace is my favourite character — sad to let this go.",
  });

  // A7 — Mewtwo, ending in 48 hrs, 1 bid
  const A7 = await mkAuction({
    sellerId: DANI, card: C_MEWTWO,
    startingPrice: "3500.00", currentBid: "3700.00", bidIncrement: "200.00",
    endsInHours: 48,
    description: "Base Set Mewtwo Holo. NM — excellent centering and surface. Great starting price. Pick it up before it closes.",
  });

  // A8 — Nami, ending in 72 hrs, NO bids yet
  const A8 = await mkAuction({
    sellerId: DANI, card: C_NAMI,
    startingPrice: "150.00", bidIncrement: "25.00",
    endsInHours: 72,
    description: "Nami Romance Dawn OP01-016. NM fresh from pack. Starting super low — first bid wins the early advantage!",
  });

  void A8; // no bids intentionally

  console.log("\n💰 Adding bids...");

  // A1 — Charizard, 8 bids, Rex winning ₱19,000
  await db.insert(bids).values([
    { id: uid(), listingId: A1, bidderId: MARCO, amount: "15500.00", createdAt: hago(22) },
    { id: uid(), listingId: A1, bidderId: KEVIN, amount: "16000.00", createdAt: hago(20) },
    { id: uid(), listingId: A1, bidderId: REX,   amount: "16500.00", createdAt: hago(18) },
    { id: uid(), listingId: A1, bidderId: MARCO, amount: "17000.00", createdAt: hago(12) },
    { id: uid(), listingId: A1, bidderId: KEVIN, amount: "17500.00", createdAt: hago(8)  },
    { id: uid(), listingId: A1, bidderId: REX,   amount: "18000.00", createdAt: hago(4)  },
    { id: uid(), listingId: A1, bidderId: MARCO, amount: "18500.00", createdAt: hago(2)  },
    { id: uid(), listingId: A1, bidderId: REX,   amount: "19000.00", createdAt: mago(30) },
  ]);
  console.log("   ✓ A1 Charizard — 8 bids, Rex winning ₱19,000 (45 min left ⚡)");

  // A2 — Blastoise, 5 bids, Kevin winning ₱6,800
  await db.insert(bids).values([
    { id: uid(), listingId: A2, bidderId: ARIA,  amount: "4700.00", createdAt: hago(20) },
    { id: uid(), listingId: A2, bidderId: KEVIN, amount: "5000.00", createdAt: hago(15) },
    { id: uid(), listingId: A2, bidderId: ARIA,  amount: "5500.00", createdAt: hago(8)  },
    { id: uid(), listingId: A2, bidderId: REX,   amount: "6100.00", createdAt: hago(3)  },
    { id: uid(), listingId: A2, bidderId: KEVIN, amount: "6800.00", createdAt: hago(1)  },
  ]);
  console.log("   ✓ A2 Blastoise — 5 bids, Kevin winning ₱6,800 (2h left)");

  // A3 — Venusaur, 6 bids, Aria winning ₱5,200
  await db.insert(bids).values([
    { id: uid(), listingId: A3, bidderId: MARCO, amount: "3200.00", createdAt: hago(22) },
    { id: uid(), listingId: A3, bidderId: KEVIN, amount: "3500.00", createdAt: hago(20) },
    { id: uid(), listingId: A3, bidderId: ARIA,  amount: "4000.00", createdAt: hago(15) },
    { id: uid(), listingId: A3, bidderId: KEVIN, amount: "4400.00", createdAt: hago(10) },
    { id: uid(), listingId: A3, bidderId: MARCO, amount: "4800.00", createdAt: hago(5)  },
    { id: uid(), listingId: A3, bidderId: ARIA,  amount: "5200.00", createdAt: hago(2)  },
  ]);
  console.log("   ✓ A3 Venusaur — 6 bids, Aria winning ₱5,200 (6h left)");

  // A4 — Trafalgar Law, 4 bids, Marco winning ₱2,600
  await db.insert(bids).values([
    { id: uid(), listingId: A4, bidderId: ARIA,  amount: "1700.00", createdAt: hago(18) },
    { id: uid(), listingId: A4, bidderId: KEVIN, amount: "2000.00", createdAt: hago(12) },
    { id: uid(), listingId: A4, bidderId: REX,   amount: "2300.00", createdAt: hago(6)  },
    { id: uid(), listingId: A4, bidderId: MARCO, amount: "2600.00", createdAt: hago(2)  },
  ]);
  console.log("   ✓ A4 Law SR — 4 bids, Marco winning ₱2,600 (10h left)");

  // A5 — Pikachu lot, 3 bids, Rex winning ₱750
  await db.insert(bids).values([
    { id: uid(), listingId: A5, bidderId: MARCO, amount: "450.00", createdAt: hago(16) },
    { id: uid(), listingId: A5, bidderId: ARIA,  amount: "600.00", createdAt: hago(8)  },
    { id: uid(), listingId: A5, bidderId: REX,   amount: "750.00", createdAt: hago(3)  },
  ]);
  console.log("   ✓ A5 Pikachu lot — 3 bids, Rex winning ₱750 (20h left)");

  // A6 — Ace, 2 bids, Aria winning ₱500
  await db.insert(bids).values([
    { id: uid(), listingId: A6, bidderId: KEVIN, amount: "400.00", createdAt: hago(10) },
    { id: uid(), listingId: A6, bidderId: ARIA,  amount: "500.00", createdAt: hago(4)  },
  ]);
  console.log("   ✓ A6 Ace — 2 bids, Aria winning ₱500 (32h left)");

  // A7 — Mewtwo, 1 bid, Kevin winning ₱3,700
  await db.insert(bids).values([
    { id: uid(), listingId: A7, bidderId: KEVIN, amount: "3700.00", createdAt: hago(6) },
  ]);
  console.log("   ✓ A7 Mewtwo — 1 bid, Kevin winning ₱3,700 (48h left)");

  console.log("   ✓ A8 Nami — 0 bids (72h left, open for first bid at ₱150)");

  // ── Completed transactions + ratings ──────────────────────────────────────
  console.log("\n🤝 Creating transactions & ratings...");

  // T1: Marco bought Charizard (fixed-price) from Joven → completed
  const t1 = uid();
  await db.insert(transactions).values({
    id: t1, listingId: jL1, buyerId: MARCO, sellerId: JOVEN,
    agreedPrice: "19500.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(10), updatedAt: dago(8),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t1, raterId: MARCO, rateeId: JOVEN, score: 5,
      comment: "Super legit! Card exactly as described. Fast transaction in Makati. Highly recommend JovenCards!" },
    { id: uid(), transactionId: t1, raterId: JOVEN, rateeId: MARCO, score: 5,
      comment: "Smooth buyer — showed up on time, exact change. A+ experience." },
  ]);

  // T2: Kevin bought Luffy from Lian → completed
  const t2 = uid();
  await db.insert(transactions).values({
    id: t2, listingId: lL1, buyerId: KEVIN, sellerId: LIAN,
    agreedPrice: "350.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(4), updatedAt: dago(3),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t2, raterId: KEVIN, rateeId: LIAN, score: 5,
      comment: "Legit card, great seller. Arrived fast in QC. Will buy again!" },
    { id: uid(), transactionId: t2, raterId: LIAN, rateeId: KEVIN, score: 4,
      comment: "Good buyer, slight delay but overall smooth deal." },
  ]);

  // T3: Aria bought Blastoise from Mira → completed
  const t3 = uid();
  await db.insert(transactions).values({
    id: t3, listingId: mL1, buyerId: ARIA, sellerId: MIRA,
    agreedPrice: "5800.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(6), updatedAt: dago(5),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t3, raterId: ARIA, rateeId: MIRA, score: 5,
      comment: "Mira is an amazing seller. Card was perfect — exactly as described. Highly trusted power seller!" },
    { id: uid(), transactionId: t3, raterId: MIRA, rateeId: ARIA, score: 5,
      comment: "Wonderful buyer — fast, reliable, and friendly. Come back anytime!" },
  ]);

  // T4: Rex bought Pikachu ×3 from Mira → completed
  const t4 = uid();
  await db.insert(transactions).values({
    id: t4, listingId: mL2, buyerId: REX, sellerId: MIRA,
    agreedPrice: "600.00", quantity: 3, method: "cash_meetup", status: "completed",
    createdAt: dago(8), updatedAt: dago(7),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t4, raterId: REX, rateeId: MIRA, score: 5,
      comment: "Super fast deal. Cards all in perfect condition. Mira is one of the best sellers here." },
    { id: uid(), transactionId: t4, raterId: MIRA, rateeId: REX, score: 5,
      comment: "Easy transaction. Rex came prepared. Recommend!" },
  ]);

  // T5: Kevin bought Venusaur from Joven → completed
  const t5 = uid();
  await db.insert(transactions).values({
    id: t5, listingId: jL3, buyerId: KEVIN, sellerId: JOVEN,
    agreedPrice: "4500.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(3), updatedAt: dago(2),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t5, raterId: KEVIN, rateeId: JOVEN, score: 4,
      comment: "Good transaction. Card was LP as described. Joven is legit." },
    { id: uid(), transactionId: t5, raterId: JOVEN, rateeId: KEVIN, score: 5,
      comment: "Great buyer, no issues at all. Will sell to again." },
  ]);

  // T6: Aria + Mira → agreed, awaiting meetup (Luffy)
  const t6 = uid();
  await db.insert(transactions).values({
    id: t6, listingId: mL3, buyerId: ARIA, sellerId: MIRA,
    agreedPrice: "300.00", quantity: 1, method: "cash_meetup", status: "agreed",
    createdAt: dago(1), updatedAt: dago(1),
  });

  // T7: Marco bought Mewtwo from Joven → completed
  const t7 = uid();
  await db.insert(transactions).values({
    id: t7, listingId: jL2, buyerId: MARCO, sellerId: JOVEN,
    agreedPrice: "4200.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(15), updatedAt: dago(14),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t7, raterId: MARCO, rateeId: JOVEN, score: 5,
      comment: "Another great deal with JovenCards. Fast meetup, legit card. My go-to Pokémon seller." },
    { id: uid(), transactionId: t7, raterId: JOVEN, rateeId: MARCO, score: 5,
      comment: "Marco again — always reliable. A pleasure to deal with." },
  ]);

  // T8: Rex bought Law SR from Lian → completed
  const t8 = uid();
  await db.insert(transactions).values({
    id: t8, listingId: lL5, buyerId: REX, sellerId: LIAN,
    agreedPrice: "2200.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(20), updatedAt: dago(19),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t8, raterId: REX, rateeId: LIAN, score: 5,
      comment: "Lian has incredible cards. The Law SR was exactly as shown — NM perfection. Will buy again!" },
    { id: uid(), transactionId: t8, raterId: LIAN, rateeId: REX, score: 5,
      comment: "Rex is a smooth buyer. Met right on time. Highly recommended!" },
  ]);

  // T9: Carlo bought Luffy from Bong → completed
  const t9 = uid();
  await db.insert(transactions).values({
    id: t9, listingId: bL3, buyerId: CARLO, sellerId: BONG,
    agreedPrice: "280.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(1), updatedAt: dago(1),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t9, raterId: CARLO, rateeId: BONG, score: 5,
      comment: "Smooth transaction at EDSA MRT. Card exactly as described. Bong is reliable." },
    { id: uid(), transactionId: t9, raterId: BONG, rateeId: CARLO, score: 5,
      comment: "Carlo was great — came on time, exact change. Will deal again!" },
  ]);

  // T10: Nina bought Law SR from Paulo → completed
  const t10 = uid();
  await db.insert(transactions).values({
    id: t10, listingId: pL3, buyerId: NINA, sellerId: PAULO,
    agreedPrice: "2100.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(4), updatedAt: dago(3),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t10, raterId: NINA, rateeId: PAULO, score: 5,
      comment: "Paulo is legit! Card was perfectly sleeved. Festival Mall meetup was easy. Highly recommended!" },
    { id: uid(), transactionId: t10, raterId: PAULO, rateeId: NINA, score: 5,
      comment: "Nina was a pleasure to deal with. Quick and easy. Welcome back anytime!" },
  ]);

  // T11: Marco bought Charizard LP from Claire → completed
  const t11 = uid();
  await db.insert(transactions).values({
    id: t11, listingId: cL1, buyerId: MARCO, sellerId: CLAIRE,
    agreedPrice: "12000.00", quantity: 1, method: "cash_meetup", status: "completed",
    createdAt: dago(6), updatedAt: dago(5),
  });
  await db.insert(ratings).values([
    { id: uid(), transactionId: t11, raterId: MARCO, rateeId: CLAIRE, score: 5,
      comment: "ClaireCards is a top-tier seller. The Charizard was exactly LP as described. Will definitely buy again!" },
    { id: uid(), transactionId: t11, raterId: CLAIRE, rateeId: MARCO, score: 5,
      comment: "Marco is one of the best buyers I've dealt with. Fast, prepared, friendly. A+!" },
  ]);

  void t2; void t3; void t4; void t5; void t6; void t7; void t8; void t9; void t10; void t11;

  console.log("   12 transactions, 22 ratings done.\n");

  // ── Offers ─────────────────────────────────────────────────────────────────
  console.log("💬 Creating offers...");

  // O1: Marco → pending offer on Mewtwo from Joven
  const o1 = uid();
  await db.insert(offers).values({
    id: o1, listingId: jL2, buyerId: MARCO, sellerId: JOVEN,
    offeredPrice: "3800.00",
    message: "Hi! Can you do 3800? I'm in Makati this weekend and can meet anytime.",
    status: "pending", expiresAt: days(2),
  });

  // O2: Kevin → countered offer on Pikachu ×3 from Mira
  const o2 = uid();
  await db.insert(offers).values({
    id: o2, listingId: mL2, buyerId: KEVIN, sellerId: MIRA,
    offeredPrice: "1500.00", message: "All 3 Pikachus for ₱1,500? Happy to meet in BGC.",
    counterPrice: "1700.00", counterMessage: "Best I can do is ₱1,700 for all 3 — they're all NM and I'm firm on that.",
    status: "countered", expiresAt: days(1),
  });

  // O3: Aria → declined offer on Law from Mira
  const o3 = uid();
  await db.insert(offers).values({
    id: o3, listingId: lL5, buyerId: ARIA, sellerId: LIAN,
    offeredPrice: "1800.00", message: "Can you do ₱1,800 for the Law SR? Willing to meet in QC.",
    status: "declined", expiresAt: dago(1),
  });

  // O4: Rex → accepted offer on Venusaur from Joven
  const o4 = uid();
  await db.insert(offers).values({
    id: o4, listingId: jL3, buyerId: REX, sellerId: JOVEN,
    offeredPrice: "4300.00", message: "₱4,300 for the Venusaur? I'm in Makati Wednesday.",
    status: "accepted", expiresAt: days(1),
  });

  void o3; void o4;

  console.log("   4 offers done.\n");

  // ── Conversations + messages ────────────────────────────────────────────────
  console.log("💬 Creating conversations...");

  // Conv 1: Marco asks Joven about Charizard
  const conv1Id = uid();
  const [c1pA, c1pB] = [MARCO, JOVEN].sort();
  await db.insert(conversations).values({
    id: conv1Id, listingId: jL1, participantA: c1pA, participantB: c1pB,
    lastMessageAt: hago(1), createdAt: hago(26),
  });
  await db.insert(messages).values([
    { id: uid(), conversationId: conv1Id, senderId: MARCO,
      body: "Hi Joven! Is the Shadowless Charizard still available? I'm very interested.",
      sentAt: hago(26), readAt: hago(24) },
    { id: uid(), conversationId: conv1Id, senderId: JOVEN,
      body: "Yes it is! This one's been stored perfectly — no scratches, crisp corners. It's the real deal.",
      sentAt: hago(25), readAt: hago(23) },
    { id: uid(), conversationId: conv1Id, senderId: MARCO,
      body: "Amazing. Any flexibility on the price? I can meet anytime in Makati this week.",
      sentAt: hago(24), readAt: hago(22) },
    { id: uid(), conversationId: conv1Id, senderId: JOVEN,
      body: "Price is firm at ₱19,500 for this one. Shadowless in this condition is extremely rare. I've had multiple inquiries already.",
      sentAt: hago(23), readAt: hago(21) },
    { id: uid(), conversationId: conv1Id, senderId: MARCO,
      body: "Fair enough. Let's do it! When works for you? I'm free Tuesday and Thursday near Ayala.",
      sentAt: hago(4), readAt: hago(2) },
    { id: uid(), conversationId: conv1Id, senderId: JOVEN,
      body: "Tuesday works! Let's meet at Greenbelt 5 ground floor, around 6PM? I'll bring the card in a toploader.",
      sentAt: hago(2), readAt: hago(1) },
    { id: uid(), conversationId: conv1Id, senderId: MARCO,
      body: "Perfect. See you there! I'll bring exact change.",
      sentAt: hago(1), readAt: null },
  ]);

  // Conv 2: Nina asks Lian about Law SR
  const conv2Id = uid();
  const [c2pA, c2pB] = [NINA, LIAN].sort();
  await db.insert(conversations).values({
    id: conv2Id, listingId: lL5, participantA: c2pA, participantB: c2pB,
    lastMessageAt: hago(3), createdAt: hago(12),
  });
  await db.insert(messages).values([
    { id: uid(), conversationId: conv2Id, senderId: NINA,
      body: "Hi! Is the Trafalgar Law Secret Rare still available? The artwork on that card is incredible.",
      sentAt: hago(12), readAt: hago(11) },
    { id: uid(), conversationId: conv2Id, senderId: LIAN,
      body: "Yes! Still available. It's one of my favourites from OP02 — absolutely stunning.",
      sentAt: hago(11), readAt: hago(10) },
    { id: uid(), conversationId: conv2Id, senderId: NINA,
      body: "Can we meet in QC? I'm in Parañaque but I can go north on weekends.",
      sentAt: hago(8), readAt: hago(7) },
    { id: uid(), conversationId: conv2Id, senderId: LIAN,
      body: "Sure! I usually meetup near Trinoma or SM North. Saturday works for me.",
      sentAt: hago(7), readAt: hago(6) },
    { id: uid(), conversationId: conv2Id, senderId: NINA,
      body: "Trinoma sounds perfect. This Saturday at 2PM? I'll buy it at full price — no haggling 😊",
      sentAt: hago(5), readAt: hago(4) },
    { id: uid(), conversationId: conv2Id, senderId: LIAN,
      body: "Deal! Saturday 2PM, Trinoma main entrance. I'll keep it reserved for you.",
      sentAt: hago(3), readAt: null },
  ]);

  // Conv 3: Carlo asks Bong about Blastoise
  const conv3Id = uid();
  const [c3pA, c3pB] = [CARLO, BONG].sort();
  await db.insert(conversations).values({
    id: conv3Id, participantA: c3pA, participantB: c3pB,
    lastMessageAt: hago(6), createdAt: hago(10),
  });
  await db.insert(messages).values([
    { id: uid(), conversationId: conv3Id, senderId: CARLO,
      body: "Hi Bong! I saw your Blastoise LP. Is the condition really just light surface wear or are there scratches on the holo?",
      sentAt: hago(10), readAt: hago(9) },
    { id: uid(), conversationId: conv3Id, senderId: BONG,
      body: "Light surface wear — no visible scratches under normal light. Very minor micro-abrasions only visible at extreme angles. The holo effect is still strong.",
      sentAt: hago(9), readAt: hago(8) },
    { id: uid(), conversationId: conv3Id, senderId: CARLO,
      body: "That sounds really good for an LP. Can you send more photos?",
      sentAt: hago(8), readAt: hago(7) },
    { id: uid(), conversationId: conv3Id, senderId: BONG,
      body: "Of course! Sending photos of all 4 corners and the holo. Give me a few minutes.",
      sentAt: hago(7), readAt: hago(6) },
    { id: uid(), conversationId: conv3Id, senderId: CARLO,
      body: "Thank you for the detailed photos! Looks great. I'm interested — where can we meet in Mandaluyong?",
      sentAt: hago(6), readAt: null },
  ]);

  console.log("   3 conversations, 18 messages done.\n");

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");

  await db.insert(notifications).values([
    {
      id: uid(), userId: KEVIN, type: "offer_countered",
      title: "Offer countered — Pikachu ×3",
      body: "Mira countered your ₱1,500 offer with ₱1,700. Respond before it expires.",
      link: `/offers/${o2}`,
      readAt: null, createdAt: dago(1),
    },
    {
      id: uid(), userId: JOVEN, type: "offer_received",
      title: "New offer on Mewtwo",
      body: "Marco offered ₱3,800 on your Mewtwo Base Set listing.",
      link: `/offers/${o1}`,
      readAt: null, createdAt: dago(1),
    },
    {
      id: uid(), userId: MIRA, type: "transaction_agreed",
      title: "Deal confirmed — Monkey D. Luffy",
      body: "Aria confirmed the deal. Arrange your meetup in BGC.",
      link: `/transactions/${t6}`,
      readAt: null, createdAt: dago(1),
    },
    {
      id: uid(), userId: MARCO, type: "auction_outbid",
      title: "You've been outbid — Charizard",
      body: "Someone placed ₱19,000 on the Charizard auction. Bid now before it closes!",
      link: `/listings/${A1}`,
      readAt: null, createdAt: mago(31),
    },
    {
      id: uid(), userId: KEVIN, type: "auction_outbid",
      title: "You've been outbid — Blastoise",
      body: "Rex placed ₱6,100 on the Blastoise auction. Counter now!",
      link: `/listings/${A2}`,
      readAt: null, createdAt: hago(3),
    },
    {
      id: uid(), userId: REX, type: "auction_outbid",
      title: "You've been outbid — Venusaur",
      body: "Aria is now winning at ₱5,200. Place a higher bid to take the lead.",
      link: `/listings/${A3}`,
      readAt: null, createdAt: hago(2),
    },
    {
      id: uid(), userId: MARCO, type: "transaction_completed",
      title: "Deal complete — Charizard",
      body: "Your Charizard purchase from JovenCards is marked complete. Don't forget to leave a rating!",
      link: `/transactions/${t1}`,
      readAt: dago(8), createdAt: dago(8),
    },
    {
      id: uid(), userId: ARIA, type: "transaction_completed",
      title: "Deal complete — Blastoise",
      body: "Your Blastoise purchase from MiraTCG is complete. Leave a rating!",
      link: `/transactions/${t3}`,
      readAt: dago(5), createdAt: dago(5),
    },
  ]);

  console.log("   8 notifications done.\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await wipe();
  await seed();

  console.log("✅ Simulation seed complete!\n");
  console.log("── Credentials ─────────────────────────────────────────────────────────────");
  console.log("  admin@tcgmarket.ph   (env)        [Admin]");
  console.log("  marco@test.com       (env)        [Buyer  — Manila, Pokémon]");
  console.log("  aria@test.com        (env)        [Buyer  — Cebu, One Piece]");
  console.log("  kevin@test.com       (env)        [Buyer  — Davao, Both]");
  console.log("  rex@test.com         (env)        [Buyer  — Pampanga, Both]");
  console.log("  carlo@test.com       (env)        [Buyer  — Pasig, Pokémon]");
  console.log("  nina@test.com        (env)        [Buyer  — Parañaque, One Piece]");
  console.log("  joven@test.com       (env)        [Seller — Makati, Pokémon ✓  rep:28]");
  console.log("  lian@test.com        (env)        [Seller — QC, One Piece ✓    rep:21]");
  console.log("  mira@test.com        (env)        [Power  — BGC, Both ✓        rep:47]");
  console.log("  dani@test.com        (env)        [Seller — Iloilo, Both ✓     rep:12]");
  console.log("  bong@test.com        (env)        [Seller — Mandaluyong, Both ✓ rep:15]");
  console.log("  claire@test.com      (env)        [Seller — Batangas, Pokémon ✓ rep:19]");
  console.log("  paulo@test.com       (env)        [Seller — Alabang, One Piece ✓ rep:8]");
  console.log("──────────────────────────────────────────────────────────────────────────────");
  console.log("\n── Active Auctions ───────────────────────────────────────────────────────────");
  console.log("  Charizard Base Set   ₱19,000 (8 bids)  — ends in 45 min  ⚡ URGENT");
  console.log("  Blastoise Base Set   ₱6,800  (5 bids)  — ends in 2h");
  console.log("  Venusaur Base Set    ₱5,200  (6 bids)  — ends in 6h");
  console.log("  Trafalgar Law SR     ₱2,600  (4 bids)  — ends in 10h");
  console.log("  Pikachu lot ×2       ₱750    (3 bids)  — ends in 20h");
  console.log("  Portgas D. Ace       ₱500    (2 bids)  — ends in 32h");
  console.log("  Mewtwo Base Set      ₱3,700  (1 bid)   — ends in 48h");
  console.log("  Nami Romance Dawn    no bids            — ends in 72h  ← first bid open");
  console.log("──────────────────────────────────────────────────────────────────────────────\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
