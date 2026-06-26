import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, count, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { getTierLimits } from "@/lib/constants/tiers";
import { inngest } from "@/lib/inngest/client";

const CONDITIONS = ["near_mint", "lightly_played", "moderately_played", "heavily_played", "damaged"] as const;
const GRADING_COMPANIES = ["none", "psa", "bgs", "cgc"] as const;
const LISTING_TTL_DAYS = 30;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const cols = headerLine.split(",").map((c) => c.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const row: Record<string, string> = {};
    cols.forEach((col, i) => { row[col] = (vals[i] ?? "").trim(); });
    return row;
  });
}

function bool(v: string): boolean {
  return v.toLowerCase() === "true" || v === "1";
}

// POST /api/listings/import — bulk import listings from CSV
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.phoneVerified) {
    return NextResponse.json({ error: "Phone verification required" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length === 0) return NextResponse.json({ error: "CSV is empty or invalid" }, { status: 400 });
  if (rows.length > 100) return NextResponse.json({ error: "Max 100 rows per import" }, { status: 400 });

  const tier   = (session.user.subscriptionTier ?? "free") as string;
  const limits = getTierLimits(tier);

  const [{ total }] = await db
    .select({ total: count() })
    .from(listings)
    .where(and(eq(listings.sellerId, session.user.id), eq(listings.status, "active")));

  const remaining = limits.maxActiveListings - total;

  const results: { row: number; cardName: string; status: "ok" | "error"; error?: string; listingId?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, account for header

    const cardName = row["cardname"] ?? row["card_name"] ?? "";
    const setName  = row["setname"]  ?? row["set_name"]  ?? "";

    if (!cardName) {
      results.push({ row: rowNum, cardName: "(blank)", status: "error", error: "cardName is required" });
      continue;
    }

    if (results.filter((r) => r.status === "ok").length >= remaining) {
      results.push({ row: rowNum, cardName, status: "error", error: `Active listing limit reached (${limits.maxActiveListings})` });
      continue;
    }

    // Find card in catalog
    const conditions = [ilike(cardCatalog.name, `%${cardName}%`)];
    if (setName) conditions.push(ilike(cardCatalog.setName, `%${setName}%`));
    const [card] = await db.select({ id: cardCatalog.id, name: cardCatalog.name }).from(cardCatalog).where(and(...conditions)).limit(1);

    if (!card) {
      results.push({ row: rowNum, cardName, status: "error", error: `Card not found: "${cardName}"${setName ? ` in set "${setName}"` : ""}` });
      continue;
    }

    const priceRaw = parseFloat(row["price"] ?? "");
    if (isNaN(priceRaw) || priceRaw <= 0) {
      results.push({ row: rowNum, cardName, status: "error", error: "Invalid price" });
      continue;
    }

    const condition = (CONDITIONS as readonly string[]).includes(row["condition"] ?? "")
      ? (row["condition"] as typeof CONDITIONS[number])
      : "near_mint";

    const isGraded      = bool(row["isgraded"] ?? row["is_graded"] ?? "");
    const gradingCoRaw  = (row["gradingcompany"] ?? row["grading_company"] ?? "none").toLowerCase();
    const gradingCompany = (GRADING_COMPANIES as readonly string[]).includes(gradingCoRaw)
      ? (gradingCoRaw as typeof GRADING_COMPANIES[number])
      : "none";
    const gradeValueRaw = parseFloat(row["gradevalue"] ?? row["grade_value"] ?? "");
    const gradeValue    = !isNaN(gradeValueRaw) && gradeValueRaw > 0 ? String(gradeValueRaw) : null;
    const isFoil        = bool(row["isfoil"]        ?? row["is_foil"]         ?? "");
    const isFirstEdition = bool(row["isfirstedition"] ?? row["is_first_edition"] ?? "");
    const qty           = Math.max(1, Math.min(99, parseInt(row["quantity"] ?? "1", 10) || 1));
    const description   = (row["description"] ?? "").slice(0, 1000) || null;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LISTING_TTL_DAYS);

    try {
      const [listing] = await db.insert(listings).values({
        sellerId: session.user.id,
        cardId:   card.id,
        condition,
        isGraded,
        gradingCompany,
        gradeValue,
        isFoil,
        isFirstEdition,
        type:  "fixed_price",
        price: String(priceRaw),
        quantity: qty,
        description,
        expiresAt,
      }).returning({ id: listings.id });

      inngest.send([
        { name: "listings/wishlist.match",     data: { listingId: listing.id, cardId: card.id, sellerId: session.user.id, price: String(priceRaw) } },
        { name: "listings/saved-search.match", data: { listingId: listing.id } },
      ]).catch(() => {});

      results.push({ row: rowNum, cardName: card.name, status: "ok", listingId: listing.id });
    } catch {
      results.push({ row: rowNum, cardName, status: "error", error: "Database error — check data and retry" });
    }
  }

  const created = results.filter((r) => r.status === "ok").length;
  const failed  = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ created, failed, results }, { status: 201 });
}
