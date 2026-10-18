import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400;

const SIZE = 192;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE, height: SIZE,
          background: "#111111",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: SIZE - 32, height: SIZE - 32,
            background: "#E24B4A",
            borderRadius: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: 86, fontWeight: 900, fontFamily: "sans-serif", lineHeight: 1 }}>
            T
          </span>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
