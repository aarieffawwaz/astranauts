import { Fragment, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Moon, Satellite } from "lucide-react";
import { INDONESIA_PROVINCES, INDONESIA_PROVINCES_LATLNG, INDONESIA_VIEWBOX, projectLonLat } from "@/lib/indonesiaGeo";

// Coordinates sourced from pamapersada.com/en/our-project site listings.
export const PAMA_REGIONS = [
  { region: "Sumatera Selatan", sites: ["MTBU", "BTSJ"], lon: 103.8, lat: -3.68 },
  { region: "Kalimantan Tengah", sites: ["SMMS", "ASMI", "TOPB"], lon: 114.93, lat: -0.97 },
  { region: "Kalimantan Selatan", sites: ["ARIA", "BBSO (Support Office)"], lon: 115.4, lat: -3.55 },
  // A.R.M.O.R pilot site: Binungan, Berau — north of the equator, hence positive lat.
  { region: "Kalimantan Timur", sites: ["KPCB", "KIDE", "INDO", "BEKB", "BAYA", "BPOP", "BRCB", "BRCG", "KPCS", "TCMM"], lon: 117.45, lat: 2.05, highlight: true },
  { region: "Sulawesi", sites: ["HMNT", "VIPO"], lon: 121.69, lat: -3.3 },
  { region: "Office", sites: ["PAMA CCOS", "PPIC", "PAMA HO"], lon: 106.93, lat: -6.2 },
];

const [, , VB_W, VB_H] = INDONESIA_VIEWBOX.split(" ").map(Number);
const ZOOM_SCALE = 3.4;

const INDONESIA_BOUNDS = [
  [6.05, 95],
  [-11.05, 141.05],
];

function SatelliteView({ selectedRegion, compact, setHovered, toggleRegion, selected }) {
  // Province borders are ~38 polygons with thousands of points combined — drawing them on
  // their own canvas renderer (instead of the default SVG) keeps flyTo pan/zoom smooth,
  // since canvas repaints as one bitmap instead of reflowing hundreds of DOM path nodes
  // every animation frame. Markers stay on SVG (default) so animate-pulse-dot still works.
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  return (
    <MapContainer
      bounds={INDONESIA_BOUNDS}
      style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      fadeAnimation={false}
    >
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      <FlyToSelected selectedRegion={selectedRegion} />
      {INDONESIA_PROVINCES_LATLNG.map((p) => (
        <Polygon
          key={p.name}
          positions={p.rings}
          renderer={canvasRenderer}
          pathOptions={{
            color: "rgba(245,158,11,0.6)",
            weight: 1,
            fillColor: "#f59e0b",
            fillOpacity: 0.08,
          }}
          interactive={false}
        />
      ))}
      {PAMA_REGIONS.map((r) => {
        const isActive = selected === r.region;
        return (
          <Fragment key={r.region}>
            {r.highlight && (
              <CircleMarker
                center={[r.lat, r.lon]}
                radius={compact ? 10 : 14}
                pathOptions={{ stroke: false, fillColor: "#f59e0b", fillOpacity: 0.35, className: "animate-pulse-dot" }}
                interactive={false}
              />
            )}
            {isActive && (
              <CircleMarker
                center={[r.lat, r.lon]}
                radius={20}
                pathOptions={{ color: "#fde68a", weight: 1.2, fill: false, opacity: 0.8 }}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[r.lat, r.lon]}
              radius={r.highlight ? (compact ? 7 : 9) : compact ? 5 : 6.5}
              pathOptions={{
                color: r.highlight ? "#fde68a" : "#1e293b",
                weight: 1.5,
                fillColor: r.highlight ? "#f59e0b" : isActive ? "#fde68a" : "#94a3b8",
                fillOpacity: 1,
              }}
              eventHandlers={
                compact
                  ? undefined
                  : {
                      click: () => toggleRegion(r.region),
                      mouseover: () => setHovered(r.region),
                      mouseout: () => setHovered(null),
                    }
              }
            >
              {!compact && <Tooltip>{r.region}: {r.sites.join(", ")}</Tooltip>}
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}

function FlyToSelected({ selectedRegion }) {
  const map = useMap();
  useEffect(() => {
    if (selectedRegion) {
      map.flyTo([selectedRegion.lat, selectedRegion.lon], 7, { duration: 0.9 });
    } else {
      map.flyToBounds(INDONESIA_BOUNDS, { duration: 0.9 });
    }
  }, [selectedRegion, map]);
  return null;
}

export default function IndonesiaMap({ compact = false, selected: selectedProp, onSelectedChange }) {
  const [hovered, setHovered] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [mapMode, setMapMode] = useState("dark");
  const isControlled = selectedProp !== undefined;
  const selected = isControlled ? selectedProp : selectedState;
  const setSelected = isControlled ? onSelectedChange : setSelectedState;

  const selectedRegion = PAMA_REGIONS.find((r) => r.region === selected);
  const scale = selectedRegion ? ZOOM_SCALE : 1;

  let groupTransform = "translate(0px,0px) scale(1)";
  if (selectedRegion) {
    const [x, y] = projectLonLat(selectedRegion.lon, selectedRegion.lat);
    const tx = VB_W / 2 - x * ZOOM_SCALE;
    const ty = VB_H / 2 - y * ZOOM_SCALE;
    groupTransform = `translate(${tx}px,${ty}px) scale(${ZOOM_SCALE})`;
  }

  const toggleRegion = (name) => setSelected((cur) => (cur === name ? null : name));

  const isSatellite = mapMode === "satellite";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 armor-dot-grid-bg [&_.leaflet-pane]:z-0">
      {isSatellite ? (
        <>
          <SatelliteView
            selectedRegion={selectedRegion}
            compact={compact}
            hovered={hovered}
            setHovered={setHovered}
            toggleRegion={toggleRegion}
            selected={selected}
          />
          {/* Brand overlay — vignette + ring on top of the real satellite imagery; province borders are drawn as real Polygons above */}
          <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(245,158,11,0.18)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-[400] rounded-2xl ring-1 ring-inset ring-amber-500/30" />
        </>
      ) : (
        <svg viewBox={INDONESIA_VIEWBOX} className="h-full w-full">
          <rect
            x="0" y="0" width={VB_W} height={VB_H}
            fill="transparent"
            onClick={() => !compact && setSelected(null)}
            style={{ cursor: !compact && selected ? "zoom-out" : "default" }}
          />
          <g
            style={{
              transform: groupTransform,
              transformOrigin: "0 0",
              transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {INDONESIA_PROVINCES.map((p) => (
              <path
                key={p.name}
                d={p.d}
                fillRule="evenodd"
                fill="rgba(245,158,11,0.07)"
                stroke="rgba(245,158,11,0.3)"
                strokeWidth={0.6 / scale}
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            ))}

            {PAMA_REGIONS.map((r) => {
              const [x, y] = projectLonLat(r.lon, r.lat);
              const isActive = selected === r.region;
              return (
                <g
                  key={r.region}
                  onMouseEnter={() => !compact && setHovered(r.region)}
                  onMouseLeave={() => !compact && setHovered(null)}
                  onClick={() => !compact && toggleRegion(r.region)}
                  style={{ cursor: compact ? "default" : "pointer" }}
                >
                  {r.highlight && (
                    <circle cx={x} cy={y} r={(compact ? 10 : 14) / scale} fill="rgba(245,158,11,0.35)" className="animate-pulse-dot" />
                  )}
                  {isActive && (
                    <circle cx={x} cy={y} r={20 / scale} fill="none" stroke="#fde68a" strokeWidth={1.2 / scale} opacity="0.8" />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={(r.highlight ? (compact ? 5 : 6) : compact ? 3.5 : 4.5) / scale}
                    fill={r.highlight ? "#f59e0b" : isActive ? "#fde68a" : "#94a3b8"}
                    stroke={r.highlight ? "#fde68a" : "#1e293b"}
                    strokeWidth={1.5 / scale}
                  />
                  {!compact && <title>{r.region}: {r.sites.join(", ")}</title>}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      <div className={`absolute ${compact ? "right-1.5 top-1.5" : "right-3 top-3"} z-[1000] flex items-center gap-0.5 rounded-lg border border-white/10 bg-slate-950/80 p-0.5 backdrop-blur-sm`}>
        <button
          type="button"
          onClick={() => setMapMode("dark")}
          className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors ${
            mapMode === "dark" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          <Moon className={compact ? "size-2.5" : "size-3"} /> {!compact && "Dark"}
        </button>
        <button
          type="button"
          onClick={() => setMapMode("satellite")}
          className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors ${
            mapMode === "satellite" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          <Satellite className={compact ? "size-2.5" : "size-3"} /> {!compact && "Satellite"}
        </button>
      </div>

      {/* Always-visible site list overlay — no hover needed */}
      {!compact && (
        <div className="pointer-events-auto absolute left-3 top-3 z-[1000] max-h-[calc(100%-1.5rem)] w-[230px] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/85 p-2.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          {PAMA_REGIONS.map((r) => {
            const isActive = selected === r.region || (!selected && hovered === r.region);
            return (
              <button
                key={r.region}
                type="button"
                onClick={() => toggleRegion(r.region)}
                onMouseEnter={() => setHovered(r.region)}
                onMouseLeave={() => setHovered(null)}
                className={`mb-1.5 block w-full rounded-md px-2 py-1.5 text-left transition-colors last:mb-0 ${
                  isActive ? "bg-amber-500/15 ring-1 ring-amber-500/40" : "hover:bg-white/5"
                }`}
              >
                <p className={`font-semibold ${r.highlight ? "text-amber-400" : "text-slate-200"}`}>
                  {r.region}
                  {r.highlight && <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">A.R.M.O.R</span>}
                </p>
                <p className="mt-0.5 leading-snug text-slate-400">{r.sites.join(" · ")}</p>
              </button>
            );
          })}
        </div>
      )}

      {!compact && (
        <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> A.R.M.O.R Pilot (Berau, Kaltim)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-400" /> PAMA Site
          </span>
        </div>
      )}

      {!compact && selected && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="absolute right-3 top-12 z-[1000] rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-sm hover:bg-white/10"
        >
          Zoom out
        </button>
      )}
    </div>
  );
}
