import { ImageResponse } from "next/og";

export const alt = "Seller Profile — TCGMarket PH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getSeller(id: string) {
  try {
    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/sellers/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.seller ?? null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111111" }}>
          <span style={{ color: "#9A9A9A", fontSize: 32, fontFamily: "sans-serif" }}>TCGMarket PH</span>
        </div>
      ),
      { ...size }
    );
  }

  const name         = seller.displayName ?? seller.name;
  const deals        = seller.completedDeals ?? 0;
  const avg          = seller.avgScore ? parseFloat(seller.avgScore).toFixed(1) : null;
  const initial      = name.charAt(0).toUpperCase();

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
          background: "radial-gradient(ellipse at 30% 50%, rgba(226,75,74,0.08) 0%, transparent 55%)",
          display: "flex",
        }} />

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "56px 100px", gap: 64 }}>

          {/* Avatar */}
          <div style={{
            width: 160, height: 160, borderRadius: "50%", flexShrink: 0,
            backgroundColor: "#1E1E1E",
            border: "3px solid rgba(226,75,74,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: "#E24B4A" }}>{initial}</span>
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Verified badge */}
            {seller.phoneVerified && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 16, fontWeight: 700, color: "#5DCAA5",
                  backgroundColor: "rgba(93,202,165,0.15)", borderRadius: 100,
                  padding: "6px 16px",
                }}>
                  Verified Seller
                </span>
              </div>
            )}

            {/* Name */}
            <span style={{
              fontSize: 72, fontWeight: 800, color: "#F2F2F2",
              lineHeight: 1.0, letterSpacing: -2,
            }}>
              {name.length > 22 ? `${name.slice(0, 22)}…` : name}
            </span>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#F2F2F2" }}>{deals}</span>
                <span style={{ fontSize: 16, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: 1 }}>Deals</span>
              </div>

              {avg && (
                <>
                  <div style={{ width: 1, height: 48, backgroundColor: "rgba(255,255,255,0.1)", display: "flex" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "#EAB308" }}>{avg} ★</span>
                    <span style={{ fontSize: 16, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: 1 }}>Rating</span>
                  </div>
                </>
              )}

              {seller.city && (
                <>
                  <div style={{ width: 1, height: 48, backgroundColor: "rgba(255,255,255,0.1)", display: "flex" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: "#F2F2F2" }}>{seller.city}</span>
                    <span style={{ fontSize: 16, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: 1 }}>Location</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 80px", borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#E24B4A" }}>TCGMarket PH</span>
          <span style={{ fontSize: 16, color: "#9A9A9A" }}>Philippines TCG card marketplace</span>
          <span style={{ fontSize: 16, color: "#9A9A9A", fontWeight: 600 }}>tcgmarket.ph</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
