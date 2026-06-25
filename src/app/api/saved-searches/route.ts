import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedSearches } from "@/db/schema/searches";

const MAX_SEARCHES = 10;

const createSchema = z.object({
  name:  z.string().min(1).max(60),
  query: z.object({
    q:         z.string().optional(),
    game:      z.string().optional(),
    condition: z.string().optional(),
    minPrice:  z.string().optional(),
    maxPrice:  z.string().optional(),
  }),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, session.user.id))
    .orderBy(desc(savedSearches.createdAt));

  return NextResponse.json({ searches });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [{ total }] = await db
    .select({ total: count() })
    .from(savedSearches)
    .where(eq(savedSearches.userId, session.user.id));

  if (total >= MAX_SEARCHES) {
    return NextResponse.json(
      { error: `Limit of ${MAX_SEARCHES} saved searches reached` },
      { status: 409 }
    );
  }

  const [search] = await db
    .insert(savedSearches)
    .values({ userId: session.user.id, name: parsed.data.name, query: parsed.data.query })
    .returning();

  return NextResponse.json({ search }, { status: 201 });
}
