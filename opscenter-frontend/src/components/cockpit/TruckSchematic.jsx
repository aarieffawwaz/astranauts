import truckSchematicSide from "@/assets/truck-schematic-side.png";

const SENSORS = [
  { label: "FRONT CAM" },
  { label: "REAR CAM" },
  { label: "LIDAR" },
  { label: "SIDE CAM L" },
  { label: "SIDE CAM R" },
  { label: "BEACON" },
];

const CORNER = "absolute size-2.5 border-amber-500/40";

export default function TruckSchematic() {
  return (
    <div className="armor-grid-bg relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-3">
      <div className={`${CORNER} left-1.5 top-1.5 border-l-2 border-t-2`} />
      <div className={`${CORNER} right-1.5 top-1.5 border-r-2 border-t-2`} />
      <div className={`${CORNER} bottom-1.5 left-1.5 border-b-2 border-l-2`} />
      <div className={`${CORNER} bottom-1.5 right-1.5 border-b-2 border-r-2`} />

      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-wide text-amber-400">
          UNIT SCHEMATIC — SIDE ELEVATION
        </span>
        <span className="font-mono text-[9px] text-green-400">ALL SENSORS NOMINAL</span>
      </div>

      <img
        src={truckSchematicSide}
        alt="HD-001 haul truck sensor schematic, side elevation"
        className="h-32 w-full object-contain"
        draggable={false}
      />

      <div className="mt-1 grid grid-cols-3 gap-x-2 gap-y-0.5 font-mono text-[9px] text-slate-400">
        {SENSORS.map((s) => (
          <span key={s.label} className="flex items-center gap-1">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-amber-500" /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
