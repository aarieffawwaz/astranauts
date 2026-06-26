const BLIPS = [
  { x: 130, y: 60, r: 3 },
  { x: 70, y: 140, r: 2 },
  { x: 150, y: 150, r: 2.5 },
];

export default function LidarView() {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="size-[92%] opacity-90">
          {[20, 40, 60, 80].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#f59e0b" strokeOpacity="0.25" strokeWidth="0.75" />
          ))}
          <line x1="100" y1="0" x2="100" y2="200" stroke="#f59e0b" strokeOpacity="0.15" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="#f59e0b" strokeOpacity="0.15" strokeWidth="0.5" />

          {BLIPS.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#fde68a" />
          ))}

          <circle cx="100" cy="100" r="3" fill="#f59e0b" />

          <g style={{ transformOrigin: "100px 100px" }} className="lidar-sweep">
            <path d="M100,100 L100,20 A80,80 0 0,1 156.6,43.4 Z" fill="url(#sweepGrad)" />
          </g>
          <defs>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute right-2 top-2 font-mono text-[10px] font-semibold tracking-wide text-amber-400">
        LIDAR
      </div>
      <div className="absolute left-2 top-2 font-mono text-[9px] text-slate-500">360° SWEEP</div>
      <style>{`
        .lidar-sweep {
          animation: lidar-spin 3.2s linear infinite;
        }
        @keyframes lidar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
