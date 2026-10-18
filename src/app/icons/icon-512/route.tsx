import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400;

const SIZE = 512;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE, height: SIZE,
          background: "#111111",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 104,
        }}
      >
        <div
          style={{
            width: SIZE - 80, height: SIZE - 80,
            background: "#E24B4A",
            borderRadius: 72,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: 230, fontWeight: 900, fontFamily: "sans-serif", lineHeight: 1 }}>
            T
          </span>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
