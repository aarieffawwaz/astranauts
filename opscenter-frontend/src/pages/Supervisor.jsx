import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, TrendingUp, TrendingDown, Gauge, Layers, Send as SendIcon, Bot, Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import { MOCK_FLEET, MOCK_LEADERBOARD, MOCK_ALERTS, MOCK_FUEL_ACTIVITY, mergeFleetWithLive } from "@/lib/mockData";
import { STATUS_COLOR } from "@/lib/constants";
import { chatBubbleClass } from "@/lib/utils";
import MineMap from "@/components/MineMap";
import PamaLogo from "@/components/PamaLogo";
import ArmorLogo from "@/components/ArmorLogo";

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
  const liveByName = useRef({});

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
      setChat((c) => [...c, { role: "ai", text: res.data?.data?.answer ?? "..." }]);
    } catch {
      setChat((c) => [...c, { role: "ai", text: "Sorry, AI service unavailable right now." }]);
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
          <span className="hidden text-sm font-medium tracking-wide text-slate-400 sm:block">BERAU MINE · SITE COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="border border-green-500/30 bg-green-500/15 text-green-400">
            <span className="mr-1 inline-block size-2 rounded-full bg-green-400 animate-pulse-dot" />
            ONLINE
          </Badge>
          <span className="font-mono text-sm tabular-nums text-slate-300">{now.toLocaleTimeString()}</span>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <KpiCard label="Active Units" value={`${stats.activeUnits}/${stats.totalUnits}`} icon={Gauge} accent="text-blue-400" />
        <KpiCard label="Avg Utilization" value={`${stats.avgUtilization}%`} icon={Layers} accent="text-amber-400" />
        <KpiCard label="Total Cycles" value={stats.totalCycles} icon={TrendingUp} accent="text-green-400" />
        <KpiCard label="Safety Score" value={`${stats.safetyScore}/100`} icon={ShieldCheck} accent="text-amber-400" />
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
                  <span className="w-8 text-[9px] text-slate-500">BATT</span>
                  <Progress value={r.battery_level} className="h-1" />
                  <span className="w-7 text-right text-[9px] text-slate-400">{r.battery_level}%</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
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
            <p className="mb-3 text-sm font-semibold tracking-wide text-slate-200">Alerts</p>
            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto">
              {alerts.map((a) => (
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

function KpiCard({ label, value, icon: Icon, accent }) {
  return (
    <Card className="flex flex-row items-center justify-between border border-white/10 bg-slate-900/60 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      </div>
      <Icon className={`size-7 ${accent}`} />
    </Card>
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
