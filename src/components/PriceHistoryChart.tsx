"use client";

interface DataPoint {
  price: number; // USD
  recordedAt: string;
}

interface Props {
  data:        DataPoint[];
  marketPrice: number | null; // current market price (USD)
}

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function PriceHistoryChart({ data, marketPrice }: Props) {
  if (data.length < 2) return null;

  // Sort oldest → newest
  const sorted = [...data].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const prices = sorted.map((d) => d.price);
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const range  = max - min || 1;

  const W = 300;
  const H = 60;
  const PAD = 4;

  // Map data → SVG coords
  const pts = sorted.map((d, i) => {
    const x = PAD + (i / (sorted.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (d.price - min) / range) * (H - PAD * 2);
    return { x, y, ...d };
  });

  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  const first   = prices[0];
  const current = marketPrice ?? prices[prices.length - 1];
  const change  = first > 0 ? ((current - first) / first) * 100 : 0;
  const up      = change >= 0;

  const lineColor  = up ? "#34d399" : "#f87171";
  const fillColor  = up ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)";

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#F2F2F2]">Market Price History</h2>
        <span className={`text-xs font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 60 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="phg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#phg)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Last point dot */}
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r="3"
          fill={lineColor}
        />
      </svg>

      <div className="flex items-center justify-between text-[10px] text-[#9A9A9A]">
        <span>{formatDate(sorted[0].recordedAt)}</span>
        <div className="flex items-center gap-3">
          <span>Low: <span className="text-[#F2F2F2]">{formatUsd(min)}</span></span>
          <span>High: <span className="text-[#F2F2F2]">{formatUsd(max)}</span></span>
          {marketPrice && (
            <span>Now: <span className="text-[#F2F2F2]">{formatUsd(marketPrice)}</span></span>
          )}
        </div>
        <span>{formatDate(sorted[sorted.length - 1].recordedAt)}</span>
      </div>
    </div>
  );
}
