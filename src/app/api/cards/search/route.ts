import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import { findCards } from "@/lib/cards/search";
import { searchRatelimit } from "@/lib/rate-limit";
import { getTierLimits } from "@/lib/constants/tiers";
import type { GameKey } from "@/lib/cards/tcgapi";

export async function GET(request: NextRequest) {
  // Per-IP rate limit: 30 searches/minute
  if (searchRatelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "anonymous";
    const { success } = await searchRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";
  const gameParam = searchParams.get("game");

  if (query.length < 2) {
    return NextResponse.json({ cards: [], fromCache: true }, { status: 200 });
  }

  const game: GameKey | undefined =
    gameParam === "pokemon" || gameParam === "one_piece"
      ? gameParam
      : undefined;

  // Optional auth — determine search result limit by tier
  const session = await auth.api.getSession({ headers: await nextHeaders() }).catch(() => null);
  const tier = (session?.user as { subscriptionTier?: string } | undefined)?.subscriptionTier ?? "free";
  const { maxSearchResults } = getTierLimits(tier);

  const result = await findCards(query, game, maxSearchResults);

  const resHeaders = new Headers();
  resHeaders.set("X-Cards-Source", result.fromCache ? "local" : "api");
  if (result.apiUnavailable) resHeaders.set("X-Api-Unavailable", "true");

  return NextResponse.json(
    {
      cards: result.cards,
      fromCache: result.fromCache,
      apiUnavailable: result.apiUnavailable ?? false,
    },
    { headers: resHeaders }
  );
}
