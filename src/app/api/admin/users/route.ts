import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q       = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const banned  = request.nextUrl.searchParams.get("banned");
  const page    = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const offset  = (page - 1) * PAGE_SIZE;

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(userTable.name,        `%${q}%`),
        ilike(userTable.displayName, `%${q}%`),
        ilike(userTable.email,       `%${q}%`),
      )
    );
  }
  if (banned === "true")  conditions.push(eq(userTable.isBanned, true));
  if (banned === "false") conditions.push(eq(userTable.isBanned, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id:              userTable.id,
      name:            userTable.name,
      displayName:     userTable.displayName,
      email:           userTable.email,
      image:           userTable.image,
      phoneVerified:   userTable.phoneVerified,
      isBanned:        userTable.isBanned,
      isAdmin:         userTable.isAdmin,
      reputationScore: userTable.reputationScore,
      noShowCount:     userTable.noShowCount,
      createdAt:       userTable.createdAt,
    })
    .from(userTable)
    .where(where)
    .orderBy(desc(userTable.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;
  return NextResponse.json({ users: rows.slice(0, PAGE_SIZE), hasMore, page });
}
