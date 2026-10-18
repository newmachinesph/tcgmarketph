"use client";

interface DayPoint { date: string; views: number }
interface Props { data: DayPoint[] }

export function ViewsChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-[#9A9A9A]">Not enough view data yet.</p>
    );
  }

  const W = 400;
  const H = 60;
  const PAD = 4;

  const counts = data.map((d) => d.views);
  const max    = Math.max(...counts, 1);

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - d.views / max) * (H - PAD * 2),
    ...d,
  }));

  const path     = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }} aria-hidden>
        <defs>
          <linearGradient id="vcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#vcg)" />
        <path d={path} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill="#6366f1" />
      </svg>
      <div className="flex items-center justify-between text-[10px] text-[#9A9A9A]">
        <span>{formatDate(data[0].date)}</span>
        <span>Peak: {Math.max(...counts).toLocaleString()} views/day</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
