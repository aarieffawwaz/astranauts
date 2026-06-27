import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  TrendingUp,
  TrendingDown,
  Gauge,
  Layers,
  Send as SendIcon,
  Bot,
  Fuel,
  Volume2,
  VolumeX,
  Radio,
  Wrench,
  Terminal,
  Lightbulb,
  Siren,
  Droplets,
  Octagon,
  Boxes,
  Clock,
  Satellite,
  Radar,
  RadioTower,
  Antenna,
  Server,
  Wind,
  Droplet,
  Eye,
  Sun,
  Cloud,
  Thermometer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import { MOCK_FLEET, MOCK_LEADERBOARD, MOCK_ALERTS, MOCK_FUEL_ACTIVITY, mergeFleetWithLive } from "@/lib/mockData";
import { STATUS_COLOR } from "@/lib/constants";
import { chatBubbleClass, cn } from "@/lib/utils";
import { useSpeech } from "@/lib/useSpeech";
import MineMap from "@/components/MineMap";
import PamaLogo from "@/components/PamaLogo";
import ArmorLogo from "@/components/ArmorLogo";
import Sparkline from "@/components/cockpit/Sparkline";

const KPI_TRENDS = {
  activeUnits: [2, 3, 3, 2, 3, 3, 3, 3],
  avgUtilization: [74, 76, 79, 77, 80, 81, 79, 82],
  totalCycles: [98, 105, 112, 118, 126, 133, 139, 145],
  safetyScore: [96, 97, 96, 97, 98, 97, 98, 98],
};

const OPERATOR_COMMS = {
  Budi: { latency: "OK", ptt: true },
  Sarif: { latency: "OK", ptt: false },
  Agus: { latency: "OK", ptt: false },
};

const PREDICTIVE_MAINTENANCE = [
  { name: "HD-001", status: "Predictive Service", detail: "Air filter change due", dueIn: "4 hours" },
  { name: "HD-002", status: "Health Alert", detail: "Hydraulic sensor calibration required", dueIn: "3 hours" },
  { name: "HD-003", status: "Nominal", detail: "Air filter change due", dueIn: "2.5 hours" },
];

const SITE_COMMAND_LOG = [
  { time: "08:06:15", type: "CMD", text: "HD-001 THROTTLE 35%" },
  { time: "08:06:18", type: "SYS", text: "HD-003 OBSTACLE_DETECTED" },
  { time: "08:06:23", type: "CMD", text: "HD-001 STEER -5deg" },
  { time: "08:06:28", type: "CMD", text: "HD-003 BRAKE 10%" },
  { time: "08:06:34", type: "SYS", text: "HD-002 IDLE_TIMEOUT" },
];

const SITE_QUICK_ACTIONS_DEFAULT = { beacons: true, headlights: true, wipers: false };
const ALERT_SEVERITIES = ["all", "critical", "warning", "info"];

const HEALTH_MONITORING = [
  { name: "HD-001", engine: 88, hydraulic: 312, tire: 92, status: "Good" },
  { name: "HD-002", engine: 91, hydraulic: 305, tire: 88, status: "Good" },
  { name: "HD-003", engine: 95, hydraulic: 290, tire: 76, status: "Caution" },
];

const FLEET_BREAKDOWN = [
  { label: "Loading", value: 6, color: "#22c55e" },
  { label: "Hauling", value: 3, color: "#3b82f6" },
  { label: "Dumping", value: 1, color: "#ef4444" },
  { label: "Idle", value: 1, color: "#94a3b8" },
  { label: "Maintenance", value: 1, color: "#f59e0b" },
];

const SYSTEM_HEALTH = [
  { label: "GPS", status: "Locked", icon: Satellite },
  { label: "LiDAR", status: "Online", icon: Radar },
  { label: "V2V Comm", status: "Online", icon: RadioTower },
  { label: "Base Station", status: "Online", icon: Antenna },
  { label: "Cloud Link", status: "Connected", icon: Server },
  { label: "E-Stop", status: "Armed", icon: ShieldCheck },
];

const SITE_CONDITIONS = [
  { label: "Wind", value: "12 km/h", icon: Wind },
  { label: "Humidity", value: "48%", icon: Droplet },
  { label: "Visibility", value: "15 km", icon: Eye },
  { label: "Dust Index", value: "Low", icon: Cloud },
];

export default function Supervisor() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [fleet, setFleet] = useState(MOCK_FLEET);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [stats, setStats] = useState({ activeUnits: 3, totalUnits: 3, avgUtilization: 82, totalCycles: 145, safetyScore: 98 });
  const [chat, setChat] = useState([{ role: "ai", text: "Hi, I'm ARMOR AI. Ask me about fleet status." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [siteActions, setSiteActions] = useState(SITE_QUICK_ACTIONS_DEFAULT);
  const [alertFilter, setAlertFilter] = useState("all");
  const liveByName = useRef({});
  const speech = useSpeech();

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);

    api
      .get("/api/robots")
      .then((res) => {
        const robots = res.data?.data ?? [];
        if (robots.length >= 3) {
          setStats((s) => ({
            ...s,
            activeUnits: robots.filter((r) => r.status === "online" || r.status === "moving").length,
            totalUnits: robots.length,
          }));
        }
      })
      .catch(() => {});

    api
      .get("/api/shifts/leaderboard")
      .then((res) => {
        const data = res.data?.data ?? [];
        if (data.length) {
          setLeaderboard(
            data.map((d, i) => ({
              rank: i + 1,
              operator: d.operator_name || `Robot ${d.robot_id}`,
              score: d.total_score,
              trend: i % 2 === 0 ? "up" : "down",
            }))
          );
        }
      })
      .catch(() => {});

    api
      .get("/api/alerts/active")
      .then((res) => {
        const data = res.data?.data ?? [];
        if (data.length) setAlerts(data);
      })
      .catch(() => {});

    connectSocket();
    const onTelemetry = ({ robot, telemetry }) => {
      liveByName.current[robot] = {
        speed: telemetry.speed,
        battery_level: telemetry.battery_level,
        x_position: telemetry.x_position,
        y_position: telemetry.y_position,
        status: telemetry.status,
      };
      setFleet(mergeFleetWithLive(liveByName.current));
    };
    const onAlert = ({ alert }) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    };
    socket.on("telemetry:update", onTelemetry);
    socket.on("alert:new", onAlert);

    return () => {
      clearInterval(tick);
      socket.off("telemetry:update", onTelemetry);
      socket.off("alert:new", onAlert);
      disconnectSocket();
    };
  }, []);

  function toggleSiteAction(key) {
    setSiteActions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function emitFleetCommand(command) {
    fleet.forEach((r) =>
      socket.emit("robot:command", {
        robot_id: r.robot_id,
        command,
        parameters: {},
        control_token: localStorage.getItem("control_token") || "",
      })
    );
  }

  const filteredAlerts = alertFilter === "all" ? alerts : alerts.filter((a) => a.level === alertFilter);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }

  async function sendChat() {
    const question = chatInput.trim();
    if (!question) return;
    setChat((c) => [...c, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await api.post("/api/rag/query", { question });
      const answer = res.data?.data?.answer ?? "...";
      setChat((c) => [...c, { role: "ai", text: answer }]);
      speech.speak(answer);
    } catch {
      const answer = "Sorry, AI service unavailable right now.";
      setChat((c) => [...c, { role: "ai", text: answer }]);
      speech.speak(answer);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_20%_-10%,rgba(245,158,11,0.06),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_40%),#0a0f1e] p-4 text-white">
      <header className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <ArmorLogo className="size-7" />
          <span className="text-lg font-extrabold tracking-wide text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">ARMOR</span>
          <span className="h-4 w-px bg-white/15" />
          <PamaLogo className="h-5 w-auto" />
          <span className="h-4 w-px bg-white/15" />
          <span className="hidden text-sm font-medium tracking-wide text-slate-400 lg:block">BERAU MINE · SITE COMMAND CENTER</span>
        </div>
        <div className="hidden items-center gap-5 xl:flex">
          <HeaderStat label="System Status" value="OPERATIONAL" valueClass="text-green-400" />
          <span className="h-7 w-px bg-white/10" />
          <HeaderStat label="Active Units" value={`${stats.activeUnits} / ${stats.totalUnits}`} valueClass="text-white" />
          <span className="h-7 w-px bg-white/10" />
          <HeaderStat label="Network" value="EXCELLENT" valueClass="text-green-400" />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="font-mono text-sm tabular-nums text-slate-200">{now.toLocaleTimeString()}</p>
            <p className="text-[10px] text-slate-500">{now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/60 py-1 pl-1 pr-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-slate-950">SO</span>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-white">Supervisor</p>
              <p className="flex items-center gap-1 text-[10px] leading-tight text-green-400">
                <span className="size-1.5 rounded-full bg-green-400" /> Online
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Fleet Utilization" value={`${stats.avgUtilization}%`} icon={Gauge} accent="text-amber-400" trend={KPI_TRENDS.avgUtilization} delta="6% vs yesterday" up />
        <KpiCard label="Material Moved" value="24,530 t" icon={Boxes} accent="text-blue-400" trend={KPI_TRENDS.totalCycles} delta="8% vs yesterday" up />
        <KpiCard label="Total Cycles" value={stats.totalCycles} icon={TrendingUp} accent="text-green-400" trend={KPI_TRENDS.totalCycles} delta="12 vs yesterday" up />
        <KpiCard label="Safety Score" value={`${stats.safetyScore}/100`} icon={ShieldCheck} accent="text-amber-400" trend={KPI_TRENDS.safetyScore} delta="2 pts vs yesterday" up />
        <KpiCard label="Active Units" value={`${stats.activeUnits}/${stats.totalUnits}`} icon={Layers} accent="text-blue-400" trend={KPI_TRENDS.activeUnits} delta="All nominal" />
        <KpiCard label="Downtime" value="2h 35m" icon={Clock} accent="text-red-400" trend={[40, 38, 35, 33, 30, 28, 26, 25]} delta="1h vs yesterday" down />
      </div>

      <div className="mt-4 grid grid-cols-[3fr_2fr] gap-4">
        <Card className="relative min-h-[440px] overflow-hidden border border-white/10 bg-slate-950/60 p-0 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent px-4 py-3 pl-14">
            <p className="text-sm font-semibold tracking-wide text-slate-200">Fleet Map · Live</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <Legend color="#22c55e" label="Moving" />
              <Legend color="#f59e0b" label="Idle" />
              <Legend color="#ef4444" label="Alert" />
            </div>
          </div>
          <MineMap fleet={fleet} height="440px" />

          <div className="absolute inset-x-3 bottom-3 z-[1000] grid grid-cols-3 gap-2">
            {fleet.map((r) => (
              <div key={r.name} className="rounded-lg border border-white/10 bg-slate-900/85 p-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{r.name}</span>
                  <Badge className={`${STATUS_COLOR[r.status] ?? STATUS_COLOR.idle} px-1.5 py-0 text-[10px]`}>{r.status}</Badge>
                </div>
                <p className="text-[11px] text-slate-400">{r.operator} · {r.speed} cm/s</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="w-8 text-[9px] text-slate-500">FUEL</span>
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${r.fuel_level ?? 0}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[9px] text-slate-400">{r.fuel_level ?? "—"}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Operator Leaderboard</p>
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 transition-colors hover:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${entry.rank === 1 ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300"}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm text-white">{entry.operator}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">{entry.score}</span>
                    {entry.trend === "up" ? (
                      <TrendingUp className="size-3.5 text-green-400" />
                    ) : (
                      <TrendingDown className="size-3.5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex-1 border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold tracking-wide text-slate-200">Alerts</p>
              <div className="flex gap-1">
                {ALERT_SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAlertFilter(s)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] capitalize transition-colors",
                      alertFilter === s ? "border-amber-500/50 bg-amber-500/15 text-amber-400" : "border-white/10 text-slate-500 hover:bg-white/5"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto">
              {filteredAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 text-xs">
                  <div>
                    <p className="text-slate-200">{a.message}</p>
                    <p className="text-slate-500">{new Date(a.created_at).toLocaleTimeString()} · Unit {a.robot_id}</p>
                  </div>
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
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <Boxes className="size-4 text-amber-400" /> Fleet Status Overview
          </p>
          <div className="flex items-center gap-4">
            <FleetDonut data={FLEET_BREAKDOWN} />
            <div className="flex-1 space-y-1.5">
              {FLEET_BREAKDOWN.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="size-2.5 rounded-full" style={{ background: b.color }} /> {b.label}
                  </span>
                  <span className="font-mono text-slate-400">{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <Thermometer className="size-4 text-red-400" /> Health Monitoring
          </p>
          <div className="space-y-1.5">
            {HEALTH_MONITORING.map((h) => (
              <div key={h.name} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-3 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 text-xs">
                <span className="w-14 font-bold text-white">{h.name}</span>
                <span className="text-slate-400">Engine <span className={h.engine >= 95 ? "text-red-400" : "font-mono text-amber-400"}>{h.engine}°C</span></span>
                <span className="text-slate-400">Hydraulic <span className="font-mono text-green-400">{h.hydraulic} bar</span></span>
                <span className="text-slate-400">Tire <span className={h.tire < 80 ? "font-mono text-amber-400" : "font-mono text-green-400"}>{h.tire}%</span></span>
                <Badge className={h.status === "Caution" ? "border-amber-500/30 bg-amber-500/15 text-amber-400" : "border-green-500/30 bg-green-500/15 text-green-400"}>
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
          <Radio className="size-4 text-blue-400" /> Operator Status
        </p>
        <div className="grid grid-cols-3 gap-3">
          {fleet.map((r) => {
            const comms = OPERATOR_COMMS[r.operator] ?? { latency: "OK", ptt: false };
            return (
              <div key={r.name} className="rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{r.operator}</span>
                  <Badge className={`${STATUS_COLOR[r.status] ?? STATUS_COLOR.idle} px-1.5 py-0 text-[10px]`}>{r.status}</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Unit {r.name}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono uppercase",
                      comms.ptt ? "border-amber-500/40 bg-amber-500/15 text-amber-400" : "border-white/10 text-slate-500"
                    )}
                  >
                    <Radio className="size-3" /> PTT {comms.ptt ? "Live" : "Idle"}
                  </span>
                  <span className="text-slate-500">Comms <span className="text-green-400">{comms.latency}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <ShieldCheck className="size-4 text-green-400" /> System Health
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SYSTEM_HEALTH.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/5 py-3 text-center">
                <s.icon className="size-5 text-green-400" />
                <span className="text-[10px] font-medium text-slate-300">{s.label}</span>
                <span className="font-mono text-[9px] text-green-400">{s.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
              <Sun className="size-4 text-amber-400" /> Site Conditions
            </p>
            <span className="font-mono text-lg font-bold text-white">23°C <span className="text-xs font-normal text-slate-400">Clear</span></span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SITE_CONDITIONS.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2">
                <c.icon className="size-4 text-slate-400" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500">{c.label}</p>
                  <p className="text-xs text-slate-200">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <Wrench className="size-4 text-amber-400" /> Predictive Maintenance
          </p>
          <div className="flex flex-col gap-2">
            {PREDICTIVE_MAINTENANCE.map((m) => (
              <div key={m.name} className="rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{m.name}</span>
                  <Badge
                    className={
                      m.status === "Health Alert"
                        ? "border-red-500/30 bg-red-500/15 text-red-400"
                        : m.status === "Predictive Service"
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                        : "border-green-500/30 bg-green-500/15 text-green-400"
                    }
                  >
                    {m.status}
                  </Badge>
                </div>
                <p className="mt-1 text-slate-400">{m.detail}</p>
                <p className="text-slate-500">Due in {m.dueIn}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            <Terminal className="size-4 text-green-400" /> Command Log
          </p>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto font-mono text-[11px]">
            {SITE_COMMAND_LOG.map((c, i) => (
              <div key={i} className="flex gap-2 text-slate-400">
                <span className="text-slate-600">{c.time}</span>
                <span className={c.type === "SYS" ? "text-amber-400" : "text-blue-400"}>{c.type}</span>
                <span className="text-slate-300">{c.text}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Quick-Action Toggles</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: "beacons", label: "All Beacons", icon: Siren },
              { key: "headlights", label: "All Headlights", icon: Lightbulb },
              { key: "wipers", label: "Site Wipers", icon: Droplets },
            ].map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => toggleSiteAction(a.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border py-2 text-[9px] font-mono uppercase transition-colors",
                  siteActions[a.key] ? "border-amber-500/50 bg-amber-500/15 text-amber-400" : "border-white/10 text-slate-500 hover:bg-white/5"
                )}
              >
                <a.icon className="size-4" />
                {a.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => emitFleetCommand("emergency_stop")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Octagon className="size-4" /> Emergency Stop (Site-Wide)
          </button>
        </Card>
      </div>

      <Card className="mt-4 border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
          <Fuel className="size-4 text-blue-400" /> Fuel Monitoring
        </p>
        <div className="grid grid-cols-[1fr_1.4fr] gap-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Per Unit</p>
            {fleet.map((r) => (
              <div key={r.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2">
                <span className="w-14 text-xs font-bold text-white">{r.name}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${r.fuel_level ?? 0}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-slate-300">{r.fuel_level ?? "—"}%</span>
                <span className="w-16 text-right text-[11px] text-slate-500">{r.fuel_burn_rate ?? "—"} L/hr</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Per Activity</p>
            {MOCK_FUEL_ACTIVITY.map((a, i) => {
              const robotName = fleet.find((r) => r.robot_id === a.robot_id)?.name ?? `Unit ${a.robot_id}`;
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/50 px-3 py-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-white">{robotName}</span>
                    <span className="ml-2 text-slate-400">{a.activity}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="font-mono text-blue-300">{a.liters}L</span>
                    <span>{a.distance_m}m</span>
                    <span>{a.efficiency != null ? `${a.efficiency} L/km` : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="mt-4 border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
          <Bot className="size-4 text-amber-400" /> AI Chat
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
        <div className="mb-2 flex max-h-32 flex-col gap-1.5 overflow-y-auto">
          {chat.map((m, i) => (
            <div key={i} className={chatBubbleClass(m.role)}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Ask ARMOR AI..."
            className="bg-slate-800/60"
          />
          <Button onClick={sendChat} disabled={chatLoading} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            <SendIcon className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, trend, delta, up, down }) {
  return (
    <Card className="border border-white/10 bg-slate-900/60 p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <Icon className={`size-4 ${accent}`} />
      </div>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      <div className="mt-1.5 flex items-center justify-between">
        {delta ? (
          <span className={cn("flex items-center gap-0.5 text-[10px]", up ? "text-green-400" : down ? "text-red-400" : "text-slate-500")}>
            {up && <TrendingUp className="size-3" />}
            {down && <TrendingDown className="size-3" />}
            {delta}
          </span>
        ) : <span />}
        {trend && <Sparkline data={trend} color="#475569" width={48} height={16} />}
      </div>
    </Card>
  );
}

function HeaderStat({ label, value, valueClass }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-mono text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function FleetDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const R = 30;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 80 80" className="size-28 -rotate-90">
        {data.map((d) => {
          const len = (d.value / total) * C;
          const seg = (
            <circle
              key={d.label}
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke={d.color}
              strokeWidth="10"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{total}</span>
        <span className="text-[9px] uppercase text-slate-500">Total Units</span>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
