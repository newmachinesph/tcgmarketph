import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, lte, desc, gt } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wantedListings } from "@/db/schema/wanted";
import { user as userTable } from "@/db/schema/auth";

const createSchema = z.object({
  game:        z.enum(["pokemon", "one_piece", "any"]),
  cardName:    z.string().min(2).max(120).trim(),
  setName:     z.string().max(120).trim().optional(),
  condition:   z.string().default("any"),
  maxPricePHP: z.coerce.number().positive().optional(),
  negotiable:  z.boolean().default(true),
  notes:       z.string().max(500).trim().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const game   = searchParams.get("game") ?? undefined;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit  = 20;
  const offset = (page - 1) * limit;
  const now    = new Date();

  const rows = await db
    .select({
      wanted:      wantedListings,
      userName:    userTable.name,
      displayName: userTable.displayName,
      userImage:   userTable.image,
      city:        userTable.city,
    })
    .from(wantedListings)
    .innerJoin(userTable, eq(wantedListings.userId, userTable.id))
    .where(and(
      eq(wantedListings.status, "open"),
      gt(wantedListings.expiresAt, now),
      game && game !== "any" ? eq(wantedListings.game, game) : undefined,
    ))
    .orderBy(desc(wantedListings.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r.wanted,
      poster: {
        name:        r.displayName ?? r.userName,
        image:       r.userImage,
        city:        r.city,
      },
    })),
    page,
    hasMore: rows.length === limit,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.phoneVerified) return NextResponse.json({ error: "Phone verification required" }, { status: 403 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { game, cardName, setName, condition, maxPricePHP, negotiable, notes } = parsed.data;

  const expiresAt = new Date(Date.now() + 30 * 86_400_000);

  const [item] = await db
    .insert(wantedListings)
    .values({
      userId:      session.user.id,
      game,
      cardName,
      setName:     setName ?? null,
      condition,
      maxPricePHP: maxPricePHP ? String(maxPricePHP) : null,
      negotiable,
      notes:       notes ?? null,
      expiresAt,
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}
