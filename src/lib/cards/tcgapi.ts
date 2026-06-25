/**
 * Thin wrapper around tcgapi.dev — the only place in the codebase that
 * directly calls the external TCG API.
 *
 * Auth: X-API-Key header.
 * Rate limit: 100 req/day on free tier. We guard this in search.ts before
 * ever calling here, so functions in this file assume the budget exists.
 */

const BASE = "https://api.tcgapi.dev";

/** Maps our DB game enum to tcgapi.dev game slugs. */
export const GAME_SLUG = {
  pokemon: "pokemon",
  one_piece: "one-piece",
} as const;

/** Maps tcgapi.dev game slugs back to our enum. */
const SLUG_TO_GAME: Record<string, "pokemon" | "one_piece"> = {
  pokemon: "pokemon",
  "one-piece": "one_piece",
};

export type GameKey = keyof typeof GAME_SLUG;

/** Shape of a single card object from tcgapi.dev /v1/search */
export interface TcgApiCard {
  id: number;
  name: string;
  clean_name: string;
  number: string | null;       // e.g. "025/185"
  rarity: string | null;
  game_slug: string;           // "pokemon" | "one-piece"
  set_name: string | null;
  printing: string | null;     // "Normal" | "Holofoil" | "Reverse Holofoil" etc.
  market_price: number | null; // USD, from TCGplayer
  price_updated_at: string | null;
  image_url: string | null;
  total_listings: number;
  product_type: string;
}

export interface TcgApiResponse {
  data: TcgApiCard[];
  meta: { total: number; page: number; per_page: number; has_more: boolean };
  rate_limit: { daily_limit: number; daily_remaining: number; daily_reset: string };
}

function apiKey() {
  const k = process.env.TCG_API_KEY;
  if (!k) throw new Error("TCG_API_KEY is not set");
  return k;
}

/**
 * Search tcgapi.dev for cards matching `query` in the given game.
 * Returns up to `perPage` results (max 100 per API limit).
 * Throws on network failure or non-2xx response.
 */
export async function searchTcgApi(
  query: string,
  game: GameKey,
  perPage = 20
): Promise<TcgApiCard[]> {
  const slug = GAME_SLUG[game];
  const url = new URL(`${BASE}/v1/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("game", slug);
  url.searchParams.set("per_page", String(perPage));

  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": apiKey() },
    signal: AbortSignal.timeout(8000), // bail after 8 s
    next: { revalidate: 0 },           // never cache at the edge
  });

  if (!res.ok) {
    throw new Error(`tcgapi.dev ${res.status}: ${await res.text()}`);
  }

  const json: TcgApiResponse = await res.json();
  return json.data;
}

/** Resolve a tcgapi.dev game slug back to our enum, or null if unsupported. */
export function slugToGameKey(slug: string): GameKey | null {
  return SLUG_TO_GAME[slug] ?? null;
}
