import { useEffect, useRef, useState } from "react";
import { useSmoothNavigate } from "@/hooks/useSmoothNavigate";
import {
  Gamepad2,
  ArrowLeft,
  Fuel,
  Volume2,
  VolumeX,
  Radio,
  AlertTriangle,
  Thermometer,
  Weight,
  Lightbulb,
  Siren,
  Droplets,
  Octagon,
  Disc3,
  Layers,
  Gauge,
  Cctv,
  Satellite,
  Radar,
  RadioTower,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import MineMap from "@/components/MineMap";
import LidarView from "@/components/cockpit/LidarView";
import Sparkline from "@/components/cockpit/Sparkline";
import { MOCK_FLEET, MOCK_FUEL_ACTIVITY, MOCK_ALERTS } from "@/lib/mockData";
import { STATUS_COLOR } from "@/lib/constants";
import { chatBubbleClass, cn } from "@/lib/utils";
import { useSpeech } from "@/lib/useSpeech";

const ROBOT_NAME = "HD-001";
const NAV_ROBOT = MOCK_FLEET.find((r) => r.name === ROBOT_NAME);
const NAV_FUEL_LOG = MOCK_FUEL_ACTIVITY.filter((a) => a.robot_id === NAV_ROBOT.robot_id);
const PRESETS = ["What is HD-001 status?", "Any safety alerts?", "Optimize my route"];

const TIRE_PRESSURE = [
  { label: "FL", value: 92 },
  { label: "FR", value: 90 },
  { label: "RL", value: 91 },
  { label: "RR", value: 89 },
];
const ENGINE_TEMP_HISTORY = [78, 81, 83, 85, 84, 86, 88, 88];
const HYDRAULIC_PRESSURE_HISTORY = [295, 300, 305, 298, 308, 310, 309, 312];
const SITE_UTILIZATION_TREND = [74, 76, 79, 77, 80, 81, 79, 82];
const CYCLE_EFFICIENCY_TREND = [6.8, 7.1, 7.4, 7.2, 7.6, 7.8, 7.5, 7.9];

const QUICK_ACTIONS_DEFAULT = { beacon: true, headlights: true, wipers: false };

const NAV_SYSTEM_HEALTH = [
  { label: "GPS", status: "Locked", icon: Satellite },
  { label: "LiDAR", status: "Online", icon: Radar },
  { label: "V2V", status: "Online", icon: RadioTower },
  { label: "Cloud", status: "Linked", icon: Server },
  { label: "E-Stop", status: "Armed", icon: ShieldCheck },
  { label: "Comms", status: "Good", icon: Radio },
];

export default function Navigator() {
  const navigate = useSmoothNavigate();
  const [pos, setPos] = useState({ x: 30, y: 60 });
  const [telemetry, setTelemetry] = useState({
    speed: 18,
    pitch: 2,
    battery_level: 85,
    network_latency_ms: 24,
    distance_to_obstacle: 45,
    collision_alert: false,
  });
  const [score, setScore] = useState({ total_score: 0, rank: "—" });
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState({ distance: 112.6, energy: 150 });
  const [quickActions, setQuickActions] = useState(QUICK_ACTIONS_DEFAULT);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Co-pilot online. Ask me anything about this route." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const startRef = useRef(Date.now());
  const speech = useSpeech();

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);

    connectSocket();
    const onTelemetry = ({ robot, telemetry: t }) => {
      if (robot !== ROBOT_NAME) return;
      setTelemetry((prev) => ({ ...prev, ...t }));
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

  function toggleQuickAction(key) {
    setQuickActions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function emitCommand(command) {
    socket.emit("robot:command", {
      robot_id: NAV_ROBOT.robot_id,
      command,
      parameters: {},
      control_token: localStorage.getItem("control_token") || "",
    });
  }

  async function ask(question) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/api/rag/query", { question });
      const answer = res.data?.data?.answer ?? "...";
      setMessages((m) => [...m, { role: "ai", text: answer }]);
      speech.speak(answer);
    } catch {
      const answer = "AI service unavailable.";
      setMessages((m) => [...m, { role: "ai", text: answer }]);
      speech.speak(answer);
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
    <div className="flex h-screen w-full flex-col gap-4 overflow-hidden bg-[#0a0f1e] p-4 text-white">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 px-4 py-2.5">
        <span className="font-mono text-sm text-slate-300">
          NAVIGATOR · UNIT <span className="text-amber-400">{ROBOT_NAME}</span> · MODE: MANUAL
        </span>
        <div className="hidden items-center gap-5 lg:flex">
          <NavStat label="Unit Status" value={(telemetry.status ?? "MOVING").toUpperCase()} valueClass="text-green-400" />
          <span className="h-7 w-px bg-white/10" />
          <NavStat label="Network" value={`${telemetry.network_latency_ms ?? 0}ms`} valueClass="text-white" />
          <span className="h-7 w-px bg-white/10" />
          <NavStat label="Signal" value="EXCELLENT" valueClass="text-green-400" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/supervisor")}>
            <ArrowLeft className="mr-1 size-4" /> Exit
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/cockpit")}>
            <Gamepad2 className="mr-1 size-4" /> Cockpit
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr_300px] gap-4 overflow-hidden">
        {/* LEFT: camera, fleet & operators, alerts, system health */}
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <Card className="overflow-hidden border border-white/10 bg-slate-900/60 p-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Cctv className="size-3.5 text-amber-400" /> Front Camera · {ROBOT_NAME}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-red-500">
                <span className="animate-blink size-1.5 rounded-full bg-red-500" /> REC
              </span>
            </div>
            <div className="relative h-28">
              <video className="absolute inset-0 size-full object-cover" src="/media/cockpit-feed.mp4" autoPlay loop muted playsInline />
              <span className="absolute left-2 top-2 size-2 border-l border-t border-amber-400/60" />
              <span className="absolute right-2 top-2 size-2 border-r border-t border-amber-400/60" />
              <span className="absolute bottom-2 left-2 size-2 border-b border-l border-amber-400/60" />
              <span className="absolute bottom-2 right-2 size-2 border-b border-r border-amber-400/60" />
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
              <Radio className="size-4 text-blue-400" /> Fleet &amp; Operators
            </p>
            <div className="flex flex-col gap-2">
              {MOCK_FLEET.map((r) => (
                <div
                  key={r.name}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs",
                    r.name === ROBOT_NAME ? "border-amber-500/40 bg-amber-500/10" : "border-white/5 bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{r.operator}</span>
                    <Badge className={`${STATUS_COLOR[r.status] ?? STATUS_COLOR.idle} px-1.5 py-0 text-[10px]`}>{r.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-slate-500">
                    <span>Unit {r.name}</span>
                    <span className="font-mono">{r.speed} cm/s</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
              <AlertTriangle className="size-4 text-amber-400" /> Detailed Alerts &amp; Logs
            </p>
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {MOCK_ALERTS.map((a) => (
                <div key={a.id} className="rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-slate-200">{a.message}</p>
                    <Badge
                      className={
                        a.level === "critical"
                          ? "border-red-500/30 bg-red-500/15 text-red-400"
                          : a.level === "warning"
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                          : "border-blue-500/30 bg-blue-500/15 text-blue-400"
                      }
                    >
                      {a.level}
                    </Badge>
                  </div>
                  <p className="mt-1 text-slate-500">{new Date(a.created_at).toLocaleTimeString()} · Unit {a.robot_id}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
              <ShieldCheck className="size-4 text-green-400" /> System Health
            </p>
            <div className="grid grid-cols-3 gap-2">
              {NAV_SYSTEM_HEALTH.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/5 py-2.5 text-center">
                  <s.icon className="size-4 text-green-400" />
                  <span className="text-[9px] font-medium text-slate-300">{s.label}</span>
                  <span className="font-mono text-[8px] text-green-400">{s.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* CENTER: tactical map + site panels */}
        <div className="flex min-h-0 flex-col gap-4">
          <Card className="relative min-h-0 flex-1 overflow-hidden border border-white/10 bg-slate-950/60 p-0">
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
                {Math.round(telemetry.speed ?? 0)} cm/s
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
                <Layers className="size-4 text-amber-400" /> Site Utilization
              </p>
              <Sparkline data={SITE_UTILIZATION_TREND} width={180} height={36} />
              <p className="mt-2 font-mono text-lg text-amber-400">{SITE_UTILIZATION_TREND.at(-1)}%</p>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
                <Gauge className="size-4 text-green-400" /> Cycle Efficiency
              </p>
              <Sparkline data={CYCLE_EFFICIENCY_TREND} width={180} height={36} color="#22c55e" />
              <p className="mt-2 font-mono text-lg text-green-400">{CYCLE_EFFICIENCY_TREND.at(-1)} cyc/hr</p>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <p className="mb-2 text-sm font-semibold tracking-wide text-slate-200">Quick-Action Toggles</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "beacon", label: "Beacon", icon: Siren },
                  { key: "headlights", label: "Headlights", icon: Lightbulb },
                  { key: "wipers", label: "Wipers", icon: Droplets },
                ].map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleQuickAction(a.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border py-2 text-[9px] font-mono uppercase transition-colors",
                      quickActions[a.key] ? "border-amber-500/50 bg-amber-500/15 text-amber-400" : "border-white/10 text-slate-500 hover:bg-white/5"
                    )}
                  >
                    <a.icon className="size-4" />
                    {a.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => emitCommand("emergency_stop")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Octagon className="size-4" /> Emergency Stop
              </button>
            </Card>
          </div>
        </div>

        {/* RIGHT: diagnostics, session, fuel, lidar, co-pilot */}
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Unit Diagnostics &amp; Telemetry</p>
            <TelemetryRow label="Power" value={`${Math.round((telemetry.speed ?? 0) * 6)}W`} pct={(telemetry.speed ?? 0) * 4} />
            <TelemetryRow label="Tilt" value={`${telemetry.pitch ?? 0}°`} pct={Math.abs(telemetry.pitch ?? 0) * 10} />
            <TelemetryRow label="Fuel" value={`${NAV_ROBOT.fuel_level ?? "—"}%`} pct={NAV_ROBOT.fuel_level ?? 0} color="bg-blue-400" />
            <TelemetryRow label="Signal" value="Good" pct={80} />
            <TelemetryRow label="Latency" value={`${telemetry.network_latency_ms ?? 0}ms`} pct={Math.min(100, telemetry.network_latency_ms ?? 0)} />

            <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300"><Thermometer className="size-3.5" /> Engine Temp</span>
                <div className="flex items-center gap-2">
                  <Sparkline data={ENGINE_TEMP_HISTORY} />
                  <span className="font-mono text-amber-400">88°C</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Hydraulic Pressure</span>
                <div className="flex items-center gap-2">
                  <Sparkline data={HYDRAULIC_PRESSURE_HISTORY} color="#22c55e" />
                  <span className="font-mono text-green-400">312 bar</span>
                </div>
              </div>
              <p className="pt-1 text-slate-300">Tire Pressure (psi)</p>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-slate-400">
                {TIRE_PRESSURE.map((t) => (
                  <div key={t.label} className="rounded-md border border-white/10 bg-slate-950/60 py-1 text-center">
                    <p className="text-slate-500">{t.label}</p>
                    <p className="text-slate-200">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-300"><Weight className="size-3.5" /> Payload Status</p>
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold text-white">90 <span className="text-xs font-normal text-slate-400">/ 100 t</span></p>
                <span className="font-mono text-sm text-amber-400">90%</span>
              </div>
              <Progress value={90} className="mt-1.5 h-1.5" />
            </div>
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

          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
              <Disc3 className="size-4 text-amber-400" /> Live 3D Lidar
            </p>
            <LidarView />
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              AI Co-pilot
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">AI Agent</span>
              <button
                type="button"
                onClick={() => speech.setEnabled((e) => !e)}
                title={speech.enabled ? "Voice reply on — click to mute" : "Voice reply off — click to enable"}
                className={`ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  speech.enabled ? "border-amber-500/40 bg-amber-500/15 text-amber-400" : "border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                {speech.enabled ? <Volume2 className="size-3" /> : <VolumeX className="size-3" />}
                Voice
              </button>
            </p>
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
      </div>
    </div>
  );
}

function NavStat({ label, value, valueClass }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-mono text-sm font-semibold ${valueClass}`}>{value}</p>
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
