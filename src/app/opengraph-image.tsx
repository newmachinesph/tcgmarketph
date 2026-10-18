import { ImageResponse } from "next/og";

export const alt = "TCGMarket PH — Buy & Sell TCG Cards in the Philippines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#111111",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: "#E24B4A", display: "flex" }} />

        {/* Subtle background gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at 20% 50%, rgba(226,75,74,0.08) 0%, transparent 60%)",
          display: "flex",
        }} />

        {/* Main content */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1,
          justifyContent: "center", padding: "48px 80px", gap: 20,
        }}>
          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 56, height: 56, borderRadius: 14,
              backgroundColor: "#E24B4A",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: "white", display: "flex" }} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#E24B4A", letterSpacing: -0.5 }}>
              TCGMarket PH
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 68, fontWeight: 800, color: "#F2F2F2", lineHeight: 1.1, letterSpacing: -2 }}>
              Buy &amp; Sell TCG Cards
            </span>
            <span style={{ fontSize: 68, fontWeight: 800, color: "#E24B4A", lineHeight: 1.1, letterSpacing: -2 }}>
              in the Philippines.
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {["Pokémon", "One Piece", "Cash on meetup", "No fees"].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 20, color: "#9A9A9A",
                  backgroundColor: "#1E1E1E", borderRadius: 100,
                  padding: "10px 24px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 80px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: 18, color: "#9A9A9A" }}>
            The Philippines&apos; TCG card marketplace
          </span>
          <span style={{ fontSize: 18, color: "#9A9A9A", fontWeight: 600 }}>tcgmarket.ph</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
