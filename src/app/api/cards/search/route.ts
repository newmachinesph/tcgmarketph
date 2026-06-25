import { NextRequest, NextResponse } from "next/server";
import { findCards } from "@/lib/cards/search";
import type { GameKey } from "@/lib/cards/tcgapi";

/**
 * GET /api/cards/search?q=charizard&game=pokemon
 *
 * Public endpoint — no auth required to search cards.
 * Auth is required at the collection/wishlist layer, not here.
 *
 * Response headers:
 *   X-Cards-Source: "local" | "api"   — for debugging (was the API called?)
 *   X-Api-Unavailable: "true"          — present when API failed
 */
export async function GET(request: NextRequest) {
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

  const result = await findCards(query, game);

  const headers = new Headers();
  headers.set("X-Cards-Source", result.fromCache ? "local" : "api");
  if (result.apiUnavailable) headers.set("X-Api-Unavailable", "true");

  return NextResponse.json(
    {
      cards: result.cards,
      fromCache: result.fromCache,
      apiUnavailable: result.apiUnavailable ?? false,
    },
    { headers }
  );
}
