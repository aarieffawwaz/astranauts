const VIEW_W = 300;
const VIEW_H = 100;

function toPoint(v, i, len, max) {
  const x = (i / (len - 1)) * VIEW_W;
  const y = VIEW_H - (v / max) * VIEW_H;
  return [x, y];
}

export default function SpeedTrendChart({ data, max = 25, unit = "cm/s", color = "#f59e0b", gradientId = "speedFill" }) {
  const points = data.map((v, i) => toPoint(v, i, data.length, max));
  const linePoints = points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `0,${VIEW_H} ${linePoints} ${VIEW_W},${VIEW_H}`;
  const [lastX, lastY] = points[points.length - 1];

  const peak = Math.max(...data);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  const current = data[data.length - 1];

  return (
    <div className="flex flex-1 flex-col">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="h-40 w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2={VIEW_W} y2={y} stroke="white" strokeOpacity="0.08" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={lastX} cy={lastY} r="3" fill={color} className="animate-pulse-dot" />
        <circle cx={lastX} cy={lastY} r="3" fill="none" stroke="#fde68a" strokeWidth="0.75" />
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 font-mono text-[11px]">
        <div>
          <p className="text-[9px] uppercase text-slate-500">Avg</p>
          <p className="text-slate-200">{avg} {unit}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase text-slate-500">Peak</p>
          <p className="text-slate-200">{peak} {unit}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase text-slate-500">Current</p>
          <p style={{ color }}>{current} {unit}</p>
        </div>
      </div>
    </div>
  );
}
