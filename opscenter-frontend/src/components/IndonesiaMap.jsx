import { useState } from "react";
import { INDONESIA_PROVINCES, INDONESIA_VIEWBOX, projectLonLat } from "@/lib/indonesiaGeo";

export const PAMA_REGIONS = [
  { region: "Sumatera Selatan", sites: ["MTBU", "BTSJ"], lon: 103.8, lat: -3.7 },
  { region: "Kalimantan Tengah", sites: ["SMMS", "ASMI", "TOPB"], lon: 113.5, lat: -1.5 },
  { region: "Kalimantan Selatan", sites: ["ARIA", "BBSO (Support Office)"], lon: 115.2, lat: -3.0 },
  { region: "Kalimantan Timur", sites: ["KPCB", "KIDE", "INDO", "BEKB", "BAYA", "BPOP", "BRCB", "BRCG", "KPCS", "TCMM"], lon: 117.5, lat: -2.1, highlight: true },
  { region: "Sulawesi", sites: ["HMNT", "VIPO"], lon: 121.7, lat: -2.6 },
  { region: "Office", sites: ["PAMA CCOS", "PPIC", "PAMA HO"], lon: 106.82, lat: -6.21 },
];

export default function IndonesiaMap({ compact = false }) {
  const [active, setActive] = useState(null);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 armor-dot-grid-bg">
      <svg viewBox={INDONESIA_VIEWBOX} className="h-full w-full">
        {INDONESIA_PROVINCES.map((p) => (
          <path
            key={p.name}
            d={p.d}
            fillRule="evenodd"
            fill="rgba(245,158,11,0.07)"
            stroke="rgba(245,158,11,0.3)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        ))}

        {PAMA_REGIONS.map((r) => {
          const [x, y] = projectLonLat(r.lon, r.lat);
          return (
            <g
              key={r.region}
              onMouseEnter={() => !compact && setActive(r.region)}
              onMouseLeave={() => !compact && setActive(null)}
              style={{ cursor: compact ? "default" : "pointer" }}
            >
              {r.highlight && (
                <circle cx={x} cy={y} r={compact ? 10 : 14} fill="rgba(245,158,11,0.35)" className="animate-pulse-dot" />
              )}
              <circle
                cx={x}
                cy={y}
                r={r.highlight ? (compact ? 5 : 6) : compact ? 3.5 : 4.5}
                fill={r.highlight ? "#f59e0b" : "#94a3b8"}
                stroke={r.highlight ? "#fde68a" : "#1e293b"}
                strokeWidth="1.5"
              />
              {!compact && <title>{r.region}: {r.sites.join(", ")}</title>}
            </g>
          );
        })}
      </svg>

      {!compact && active && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[260px] rounded-lg border border-amber-500/30 bg-slate-900/95 px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <p className="font-semibold text-amber-400">{active}</p>
          <p className="mt-1 text-slate-300">
            {PAMA_REGIONS.find((r) => r.region === active)?.sites.join(" · ")}
          </p>
        </div>
      )}

      {!compact && (
        <div className="absolute bottom-3 right-3 flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> A.R.M.O.R Pilot (Berau, Kaltim)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-400" /> PAMA Site
          </span>
        </div>
      )}
    </div>
  );
}
