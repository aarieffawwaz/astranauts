import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2, ArrowLeft, Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import MineMap from "@/components/MineMap";
import { MOCK_FLEET, MOCK_FUEL_ACTIVITY } from "@/lib/mockData";
import { chatBubbleClass } from "@/lib/utils";

const ROBOT_NAME = "HD-001";
const NAV_ROBOT = MOCK_FLEET.find((r) => r.name === ROBOT_NAME);
const NAV_FUEL_LOG = MOCK_FUEL_ACTIVITY.filter((a) => a.robot_id === NAV_ROBOT.robot_id);
const PRESETS = ["What is HD-001 status?", "Any safety alerts?", "Optimize my route"];

export default function Navigator() {
  const navigate = useNavigate();
  const [pos, setPos] = useState({ x: 30, y: 60 });
  const [telemetry, setTelemetry] = useState({
    speed: 18,
    pitch: 2,
    battery_level: 85,
    network_latency_ms: 24,
    distance_to_obstacle: 45,
    collision_alert: false,
  });
  const [harshEvents, setHarshEvents] = useState(0);
  const [score, setScore] = useState({ total_score: 0, rank: "—" });
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState({ distance: 112.6, energy: 150 });
  const [messages, setMessages] = useState([
    { role: "ai", text: "Co-pilot online. Ask me anything about this route." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);

    connectSocket();
    const onTelemetry = ({ robot, telemetry: t }) => {
      if (robot !== ROBOT_NAME) return;
      setTelemetry((prev) => ({ ...prev, ...t }));
      if (t.collision_alert) setHarshEvents((h) => h + 1);
      if (typeof t.x_position === "number") setPos({ x: t.x_position, y: t.y_position });
    };
    const onScore = ({ robot_id, scores, rank }) => {
      if (robot_id !== 1) return;
      setScore({ total_score: scores.total_score, rank });
    };
    socket.on("telemetry:update", onTelemetry);
    socket.on("score:update", onScore);

    return () => {
      clearInterval(tick);
      socket.off("telemetry:update", onTelemetry);
      socket.off("score:update", onScore);
      disconnectSocket();
    };
  }, []);

  async function ask(question) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/api/rag/query", { question });
      setMessages((m) => [...m, { role: "ai", text: res.data?.data?.answer ?? "..." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "AI service unavailable." }]);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  return (
    <div className="grid h-screen w-full grid-cols-[2fr_1fr] grid-rows-[auto_1fr_auto] gap-4 overflow-hidden bg-[#0a0f1e] p-4 text-white">
      <div className="col-span-2 flex items-center justify-between">
        <span className="font-mono text-sm text-slate-300">
          NAVIGATOR · UNIT <span className="text-amber-400">{ROBOT_NAME}</span> · MODE: MANUAL
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/supervisor")}>
            <ArrowLeft className="mr-1 size-4" /> Exit
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/cockpit")}>
            <Gamepad2 className="mr-1 size-4" /> Cockpit
          </Button>
        </div>
      </div>

      <Card className="relative min-h-0 overflow-hidden border border-white/10 bg-slate-950/60 p-0">
        <div className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent px-4 py-3 pl-14">
          <p className="text-sm font-semibold tracking-wide text-slate-200">Tactical Map</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> Moving</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Idle</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Alert</span>
          </div>
        </div>
        <MineMap fleet={[{ ...NAV_ROBOT, geoPosition: pos.geo ?? NAV_ROBOT.geoPosition }]} height="100%" />
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-white/10 bg-slate-900/85 p-2.5 backdrop-blur-sm">
          <p className="text-xs font-bold text-white">{ROBOT_NAME} · {NAV_ROBOT.operator}</p>
          <p className="text-[11px] text-slate-400">
            {Math.round(telemetry.speed ?? 0)} cm/s · {Math.round(telemetry.battery_level ?? 0)}% batt
          </p>
        </div>
      </Card>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Telemetry</p>
          <TelemetryRow label="Power" value={`${Math.round((telemetry.speed ?? 0) * 6)}W`} pct={(telemetry.speed ?? 0) * 4} />
          <TelemetryRow label="Tilt" value={`${telemetry.pitch ?? 0}°`} pct={Math.abs(telemetry.pitch ?? 0) * 10} />
          <TelemetryRow label="Battery" value={`${Math.round(telemetry.battery_level ?? 0)}%`} pct={telemetry.battery_level ?? 0} />
          <TelemetryRow label="Fuel" value={`${NAV_ROBOT.fuel_level ?? "—"}%`} pct={NAV_ROBOT.fuel_level ?? 0} color="bg-blue-400" />
          <TelemetryRow label="Signal" value="Good" pct={80} />
          <TelemetryRow label="Latency" value={`${telemetry.network_latency_ms ?? 0}ms`} pct={Math.min(100, telemetry.network_latency_ms ?? 0)} />
          <TelemetryRow label="Harsh Events" value={`${harshEvents}`} pct={Math.min(100, harshEvents * 20)} />
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Session Stats</p>
          <div className="space-y-1 text-sm text-slate-300">
            <div className="flex justify-between"><span>Drive time</span><span className="font-mono text-amber-400">{formatTime(elapsed)}</span></div>
            <div className="flex justify-between"><span>Distance traveled</span><span className="font-mono">{stats.distance}m</span></div>
            <div className="flex justify-between"><span>Energy used</span><span className="font-mono">{stats.energy}kWh</span></div>
            <div className="flex justify-between"><span>Score</span><span className="font-mono text-amber-400">{score.total_score || "—"} ({score.rank})</span></div>
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <Fuel className="size-4 text-blue-400" /> Fuel · This Activity
          </p>
          <div className="space-y-1.5">
            {NAV_FUEL_LOG.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-300">{a.activity}</span>
                <span className="font-mono text-blue-300">{a.liters}L</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/10 pt-1.5 text-sm">
              <span className="text-slate-400">Total this shift</span>
              <span className="font-mono font-semibold text-blue-300">
                {NAV_FUEL_LOG.reduce((sum, a) => sum + a.liters, 0).toFixed(1)}L
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="col-span-2 border border-white/10 bg-slate-900/60 p-4">
        <p className="mb-2 text-sm font-medium text-slate-300">AI Co-pilot</p>
        <div className="mb-2 flex max-h-28 flex-col gap-1.5 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={chatBubbleClass(m.role)}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} variant="outline" size="sm" onClick={() => ask(p)} disabled={loading}>
              {p}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask co-pilot..."
            className="bg-slate-800/60"
          />
          <Button onClick={() => ask(input)} disabled={loading} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TelemetryRow({ label, value, pct, color }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value}</span>
      </div>
      {color ? (
        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
        </div>
      ) : (
        <Progress value={clamped} className="h-1.5" />
      )}
    </div>
  );
}
