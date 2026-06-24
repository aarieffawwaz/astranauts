import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Tooltip,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MINE_CENTER,
  MINE_BOUNDARY_GEOJSON,
  HAUL_ROAD_GEOJSON,
  WAYPOINTS,
} from "@/lib/mineGeoData";
import truckHD001 from "@/assets/trucks/HD-001.jpeg";
import truckHD002 from "@/assets/trucks/HD-002.jpeg";
import truckHD003 from "@/assets/trucks/HD-003.jpeg";

const STATUS_HEX = {
  moving: "#22c55e",
  idle: "#f59e0b",
  alert: "#ef4444",
  online: "#22c55e",
  offline: "#64748b",
};

const TRUCK_PHOTOS = {
  "HD-001": truckHD001,
  "HD-002": truckHD002,
  "HD-003": truckHD003,
};

function truckIcon(color, label, photo) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:42px;height:42px;border-radius:8px;overflow:hidden;border:2px solid ${color};box-shadow:0 0 10px ${color}aa, 0 2px 6px rgba(0,0,0,0.6);">
          <img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        <span style="margin-top:1px;font-size:10px;font-weight:700;color:${color};background:#0a0f1eaa;padding:0 4px;border-radius:3px;white-space:nowrap;">${label}</span>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
}

export default function MineMap({ fleet, height = "100%", onSelect, selectedName }) {
  const boundaryStyle = useMemo(
    () => ({ color: "#f59e0b", weight: 1.5, fillColor: "#f59e0b", fillOpacity: 0.06, dashArray: "4 4" }),
    []
  );
  const roadStyle = useMemo(
    () => ({ color: "#3b82f6", weight: 2.5, opacity: 0.7, dashArray: "1 6" }),
    []
  );

  return (
    <div style={{ height, width: "100%" }} className="overflow-hidden rounded-lg [&_.leaflet-control-attribution]:bg-slate-900/70 [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:text-slate-400 [&_.leaflet-control-zoom-in]:bg-slate-900 [&_.leaflet-control-zoom-in]:text-white [&_.leaflet-control-zoom-out]:bg-slate-900 [&_.leaflet-control-zoom-out]:text-white">
      <MapContainer
        center={MINE_CENTER}
        zoom={14}
        style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON data={MINE_BOUNDARY_GEOJSON} style={() => boundaryStyle} />
        <GeoJSON data={HAUL_ROAD_GEOJSON} style={() => roadStyle} />

        {WAYPOINTS.map((wp) => (
          <CircleMarker
            key={wp.name}
            center={wp.position}
            radius={6}
            pathOptions={{ color: "#94a3b8", fillColor: "#0a0f1e", fillOpacity: 1, weight: 2 }}
          >
            <Tooltip permanent direction="top" className="!border-none !bg-transparent !shadow-none !text-slate-300 !text-xs">
              {wp.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {fleet.map((r) => (
          <Marker
            key={r.name}
            position={r.geoPosition}
            icon={truckIcon(STATUS_HEX[r.status] ?? STATUS_HEX.idle, r.name, TRUCK_PHOTOS[r.name] ?? truckHD001)}
            eventHandlers={onSelect ? { click: () => onSelect(r) } : undefined}
          >
            <Tooltip>
              {r.name} — {r.operator} — {r.status}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
