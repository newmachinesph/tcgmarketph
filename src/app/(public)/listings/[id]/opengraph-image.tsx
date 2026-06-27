import { ImageResponse } from "next/og";
import { CONDITION_LABEL } from "@/lib/validations/listing";
import { GAME_LABEL } from "@/lib/constants/games";

export const alt = "Listing — TCGMarket PH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GAME_COLOR: Record<string, string> = {
  pokemon:   "#EAB308",
  one_piece: "#EF4444",
};

async function getListing(id: string) {
  try {
    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/listings/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json().then((d) => d.listing);
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111111" }}>
          <span style={{ color: "#9A9A9A", fontSize: 32, fontFamily: "sans-serif" }}>TCGMarket PH</span>
        </div>
      ),
      { ...size }
    );
  }

  const game       = GAME_LABEL[listing.card.game] ?? listing.card.game;
  const gameColor  = GAME_COLOR[listing.card.game] ?? "#9A9A9A";
  const condition  = listing.isGraded
    ? `${listing.gradingCompany?.toUpperCase()} ${listing.gradeValue}`
    : CONDITION_LABEL[listing.condition] ?? listing.condition;
  const price      = parseFloat(listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  const sellerName = listing.seller.displayName ?? listing.seller.name;
  const isAuction  = listing.type === "auction";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          backgroundColor: "#111111", fontFamily: "sans-serif", position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: "#E24B4A", display: "flex" }} />

        {/* Subtle gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at 80% 50%, ${gameColor}15 0%, transparent 55%)`,
          display: "flex",
        }} />

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, padding: "56px 80px", gap: 0 }}>

          {/* Left: card visual */}
          <div style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            width: 240, marginRight: 60, flexShrink: 0,
          }}>
            <div style={{
              width: 200, height: 280,
              borderRadius: 16,
              border: `2px solid ${gameColor}40`,
              backgroundColor: "#1E1E1E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}>
              {listing.card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.card.imageUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt={listing.card.name}
                />
              ) : (
                <span style={{ fontSize: 64, color: gameColor, opacity: 0.5 }}>?</span>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 16 }}>
            {/* Game + condition tags */}
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{
                fontSize: 16, fontWeight: 700, color: gameColor,
                backgroundColor: `${gameColor}20`, borderRadius: 100, padding: "6px 16px",
              }}>
                {game}
              </span>
              {isAuction && (
                <span style={{
                  fontSize: 16, fontWeight: 700, color: "#F97316",
                  backgroundColor: "#F9731620", borderRadius: 100, padding: "6px 16px",
                }}>
                  AUCTION
                </span>
              )}
              <span style={{
                fontSize: 16, color: "#9A9A9A",
                backgroundColor: "#1E1E1E", borderRadius: 100, padding: "6px 16px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {condition}
              </span>
            </div>

            {/* Card name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{
                fontSize: 52, fontWeight: 800, color: "#F2F2F2",
                lineHeight: 1.1, letterSpacing: -1.5,
              }}>
                {listing.card.name.length > 30 ? `${listing.card.name.slice(0, 30)}…` : listing.card.name}
              </span>
              {listing.card.setName && (
                <span style={{ fontSize: 22, color: "#9A9A9A" }}>{listing.card.setName}</span>
              )}
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: "#E24B4A", letterSpacing: -1 }}>
                ₱{price}
              </span>
            </div>

            {/* Seller */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: "#2A2A2A",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#9A9A9A" }}>
                  {sellerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: 20, color: "#9A9A9A" }}>
                {sellerName}{listing.seller.city ? ` · ${listing.seller.city}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 80px", borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#E24B4A" }}>TCGMarket PH</span>
          <span style={{ fontSize: 16, color: "#9A9A9A" }}>Cash on meetup · No fees</span>
          <span style={{ fontSize: 16, color: "#9A9A9A", fontWeight: 600 }}>tcgmarket.ph</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
