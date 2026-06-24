import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Battery, Gauge, User, Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import { MOCK_FLEET, mergeFleetWithLive } from "@/lib/mockData";
import { STATUS_COLOR } from "@/lib/constants";
import MineMap from "@/components/MineMap";

const FILTERS = ["All", "Moving", "Idle", "Alert"];

export default function MapView() {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState(MOCK_FLEET);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(new Date());
  const liveByName = useRef({});

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    connectSocket();
    const onTelemetry = ({ robot, telemetry }) => {
      liveByName.current[robot] = {
        speed: telemetry.speed,
        battery_level: telemetry.battery_level,
        status: telemetry.status,
      };
      setFleet(mergeFleetWithLive(liveByName.current));
    };
    socket.on("telemetry:update", onTelemetry);
    return () => {
      clearInterval(tick);
      socket.off("telemetry:update", onTelemetry);
      disconnectSocket();
    };
  }, []);

  const visible = fleet.filter((r) => filter === "All" || r.status === filter.toLowerCase());
  const counts = {
    All: fleet.length,
    Moving: fleet.filter((r) => r.status === "moving").length,
    Idle: fleet.filter((r) => r.status === "idle").length,
    Alert: fleet.filter((r) => r.status === "alert").length,
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0f1e] text-white">
      <div className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/supervisor")}>
            <ArrowLeft className="mr-1 size-4" /> Supervisor
          </Button>
          <span className="text-sm font-semibold tracking-wide text-slate-200">FLEET MAP · FULL VIEW</span>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-amber-500 bg-amber-500/15 text-amber-400"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
          <span className="ml-2 font-mono text-xs text-slate-400">UTC {now.toUTCString().slice(17, 25)}</span>
        </div>
      </div>

      <MineMap
        fleet={visible}
        height="100vh"
        onSelect={(r) => setSelected(r)}
      />

      {selected && (
        <Card className="absolute right-4 top-20 z-[1000] w-72 border border-white/10 bg-slate-900/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-white">UNIT DETAIL · {selected.name}</p>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <Badge className={STATUS_COLOR[selected.status] ?? STATUS_COLOR.idle}>{selected.status}</Badge>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400"><User className="size-3.5" /> Operator</span>
              <span>{selected.operator}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400"><Gauge className="size-3.5" /> Speed</span>
              <span>{selected.speed} cm/s</span>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Battery className="size-3.5" /> Battery</span>
                <span className="text-slate-300">{selected.battery_level}%</span>
              </div>
              <Progress value={selected.battery_level} className="h-1.5" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Fuel className="size-3.5" /> Fuel</span>
                <span className="text-slate-300">{selected.fuel_level ?? "—"}% · {selected.fuel_burn_rate ?? "—"} L/hr</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${selected.fuel_level ?? 0}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Score</span>
              <span className="font-mono text-amber-400">{selected.score}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
