import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { userCollection, cardCatalog } from "@/db/schema/cards";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const page   = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit  = 24;
  const offset = (page - 1) * limit;

  const SELLER_FIELDS = {
    id:               userTable.id,
    name:             userTable.name,
    displayName:      userTable.displayName,
    username:         userTable.username,
    collectionPublic: userTable.collectionPublic,
  };

  let [seller] = await db.select(SELLER_FIELDS).from(userTable).where(eq(userTable.id, id));
  if (!seller) {
    [seller] = await db.select(SELLER_FIELDS).from(userTable).where(eq(userTable.username, id));
  }

  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!seller.collectionPublic) {
    return NextResponse.json({ error: "Collection is private" }, { status: 403 });
  }

  const rows = await db
    .select({
      id:             userCollection.id,
      quantity:       userCollection.quantity,
      condition:      userCollection.condition,
      gradingCompany: userCollection.gradingCompany,
      gradeValue:     userCollection.gradeValue,
      isFoil:         userCollection.isFoil,
      isFirstEdition: userCollection.isFirstEdition,
      language:       userCollection.language,
      isFavorite:     userCollection.isFavorite,
      card: {
        id:      cardCatalog.id,
        name:    cardCatalog.name,
        setName: cardCatalog.setName,
        game:    cardCatalog.game,
        rarity:  cardCatalog.rarity,
        imageUrl: cardCatalog.imageUrl,
      },
    })
    .from(userCollection)
    .innerJoin(cardCatalog, eq(userCollection.cardId, cardCatalog.id))
    .where(eq(userCollection.userId, seller.id))
    .orderBy(desc(userCollection.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;

  return NextResponse.json({
    seller: {
      id:          seller.id,
      name:        seller.name,
      displayName: seller.displayName,
      username:    seller.username,
    },
    items:   rows.slice(0, limit),
    hasMore,
    page,
    total:   rows.slice(0, limit).length + offset,
  });
}
