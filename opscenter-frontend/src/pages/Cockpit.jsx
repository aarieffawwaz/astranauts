import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wifi,
  Compass,
  ArrowLeft,
  Gauge,
  Satellite,
  ShieldAlert,
  Radio,
  Octagon,
  MapPin,
  SignalHigh,
  Weight,
  Thermometer,
  Wind,
  Eye,
  CloudFog,
  UserCircle2,
  ShieldCheck,
  Terminal,
  Users,
  Mic,
  Hexagon,
  AlertTriangle,
  Lightbulb,
  Volume2,
  Siren,
  Droplets,
  BatteryMedium,
  Lock,
  UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import ControlModeToggle from "@/components/cockpit/ControlModeToggle";
import CameraFeedPanel from "@/components/cockpit/CameraFeedPanel";
import LidarView from "@/components/cockpit/LidarView";
import TruckSchematic from "@/components/cockpit/TruckSchematic";
import Sparkline from "@/components/cockpit/Sparkline";
import SpeedTrendChart from "@/components/cockpit/SpeedTrendChart";

const ROBOT_ID = 1;
const ROBOT_NAME = "HD-001";
const KEYS = ["w", "a", "s", "d"];

const HEALTH_CHECKS = [
  { label: "GPS Lock", ok: true },
  { label: "LiDAR Online", ok: true },
  { label: "Comms Latency", ok: true, value: "42ms" },
  { label: "E-Stop Ready", ok: true },
];

const EVENT_LOG = [
  { time: "10:24:11", text: "Waypoint updated: DUMP-B" },
  { time: "10:23:47", text: "Dust level high: Sector 7" },
  { time: "10:22:31", text: "Comms latency nominal" },
  { time: "10:21:05", text: "System diagnostics OK" },
  { time: "10:20:00", text: "Session started" },
];

const TIRE_PRESSURE = [
  { label: "FL", value: 92 },
  { label: "FR", value: 90 },
  { label: "RL", value: 91 },
  { label: "RR", value: 89 },
];

const ENGINE_TEMP_HISTORY = [78, 81, 83, 85, 84, 86, 88, 88];
const HYDRAULIC_PRESSURE_HISTORY = [295, 300, 305, 298, 308, 310, 309, 312];

const SITE_CONDITIONS = [
  { label: "Wind Speed", value: "12 km/h", icon: Wind },
  { label: "Visibility", value: "78%", icon: Eye },
  { label: "Ambient Temp", value: "28°C", icon: Thermometer },
  { label: "Dust Index", value: "HIGH", icon: CloudFog, alert: true },
];

const COMMAND_LOG = [
  { time: "10:24:12", type: "CMD", text: "SET_SPEED 18 cm/s" },
  { time: "10:24:07", type: "CMD", text: "SET_HEADING 145°" },
  { time: "10:24:03", type: "CMD", text: "APPROACH_OBJECT" },
  { time: "10:23:58", type: "SYS", text: "OBSTACLE_DETECTED" },
  { time: "10:23:55", type: "CMD", text: "STOP" },
];

const OTHER_OPERATORS = [
  { id: "OP-7841", online: true },
  { id: "OP-7843", online: true },
];

const QUICK_ACTIONS_DEFAULT = {
  headlights: true,
  horn: false,
  beacon: true,
  wipers: false,
};

const ROUTE_CHECKPOINTS = [
  { label: "LOAD PT A", done: true },
  { label: "WP-12", done: true },
  { label: "WP-18", current: true },
  { label: "DUMP PT B" },
];

const SPEED_TREND = [12, 14, 16, 15, 17, 18, 18, 19, 18, 17, 18, 18];
const BATTERY_TREND = [91, 90, 90, 89, 88, 88, 87, 87, 86, 86, 85, 85];

export default function Cockpit() {
  const navigate = useNavigate();
  const [controlMode, setControlMode] = useState("real");
  const [telemetry, setTelemetry] = useState({
    battery_level: 85,
    speed: 18,
    distance_to_obstacle: 45,
    status: "moving",
  });
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [quickActions, setQuickActions] = useState(QUICK_ACTIONS_DEFAULT);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [shiftSeconds, setShiftSeconds] = useState(8077);

  useEffect(() => {
    const id = setInterval(() => setShiftSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function toggleQuickAction(key) {
    setQuickActions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function formatShiftDuration(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function emitCommand(command) {
    socket.emit("robot:command", {
      robot_id: ROBOT_ID,
      command,
      parameters: {},
      control_token: localStorage.getItem("control_token") || "",
    });
  }

  useEffect(() => {
    connectSocket();
    const onTelemetry = ({ robot, telemetry: t }) => {
      if (robot !== ROBOT_NAME) return;
      setTelemetry((prev) => ({ ...prev, ...t }));
    };
    socket.on("telemetry:update", onTelemetry);

    return () => {
      socket.off("telemetry:update", onTelemetry);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (controlMode !== "keyboard") {
      setActiveKeys(new Set());
      return;
    }

    function onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === " ") {
        setActiveKeys((prev) => new Set(prev).add("space"));
        emitCommand("emergency_stop");
        return;
      }
      if (!KEYS.includes(key)) return;
      setActiveKeys((prev) => new Set(prev).add(key));
      const map = { w: "forward", s: "backward", a: "left", d: "right" };
      emitCommand(map[key]);
    }

    function onKeyUp(e) {
      const key = e.key.toLowerCase();
      const label = key === " " ? "space" : key;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(label);
        return next;
      });
      if (KEYS.includes(key)) emitCommand("stop");
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [controlMode]);

  const spaceActive = activeKeys.has("space");
  const distSafe = (telemetry.distance_to_obstacle ?? 45) > 30;

  return (
    <div className="armor-dot-grid-bg flex h-screen w-full flex-col overflow-hidden bg-slate-950 p-4 text-white">
      {/* header */}
      <header className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/supervisor")}>
            <ArrowLeft className="mr-1 size-4" /> Supervisor
          </Button>
          <span className="font-mono text-lg font-bold text-amber-400">{ROBOT_NAME}</span>
          <Badge variant="outline" className="border-green-500/30 bg-green-500/15 text-green-400">
            LINK ACTIVE
          </Badge>
        </div>
        <span className="flex items-center gap-4 font-mono text-sm">
          <span className="text-amber-400">BATTERY {Math.round(telemetry.battery_level ?? 0)}%</span>
          <span className="text-blue-400">FUEL {telemetry.fuel_level ?? 68}%</span>
        </span>
        <div className="flex items-center gap-2 text-slate-400">
          <Wifi className="size-4" />
          <Button variant="outline" size="sm" onClick={() => navigate("/navigator")}>
            <Compass className="mr-1 size-4" /> Navigator
          </Button>
        </div>
      </header>

      {/* console body */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[260px_1fr_280px]">
        {/* LEFT: telemetry + system health */}
        <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Gauge className="size-3.5" /> Speed
            </p>
            <p className="text-2xl font-bold text-white">{Math.round(telemetry.speed ?? 0)} cm/s</p>
            <Progress value={Math.min(100, (telemetry.speed ?? 0) * 4)} className="mt-2 h-1.5" />
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <ShieldAlert className="size-3.5" /> Distance
            </p>
            <p className="text-2xl font-bold text-white">
              {Math.round(telemetry.distance_to_obstacle ?? 45)}cm{" "}
              <span className={distSafe ? "text-green-400" : "text-red-400"}>
                {distSafe ? "SAFE" : "DANGER"}
              </span>
            </p>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Satellite className="size-3.5" /> System Health
            </p>
            <div className="space-y-1.5">
              {HEALTH_CHECKS.map((h) => (
                <div key={h.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{h.label}</span>
                  <span className={cn("font-mono", h.ok ? "text-green-400" : "text-red-400")}>
                    {h.value ?? (h.ok ? "OK" : "FAULT")}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 text-xs uppercase text-slate-400">Alerts / Event Log</p>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
              {EVENT_LOG.map((e) => (
                <p key={e.time}>
                  <span className="text-slate-500">{e.time}</span> {e.text}
                </p>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Weight className="size-3.5" /> Payload Status
            </p>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold text-white">
                182.4 <span className="text-sm font-normal text-slate-400">/ 240 t</span>
              </p>
              <span className="font-mono text-sm text-amber-400">76%</span>
            </div>
            <Progress value={76} className="mt-2 h-1.5" />
            <p className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
              <span>CAPACITY</span> <span>240 t</span>
            </p>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Thermometer className="size-3.5" /> Engine &amp; Hydraulics
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Engine Temp</span>
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
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300">Tire Pressure (psi)</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-slate-400">
                {TIRE_PRESSURE.map((t) => (
                  <div key={t.label} className="rounded-md border border-white/10 bg-slate-950/60 py-1 text-center">
                    <p className="text-slate-500">{t.label}</p>
                    <p className="text-slate-200">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Wind className="size-3.5" /> Site Conditions
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              {SITE_CONDITIONS.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <c.icon className={cn("size-3.5", c.alert ? "text-red-400" : "text-slate-400")} />
                  <div>
                    <p className="text-[9px] uppercase text-slate-500">{c.label}</p>
                    <p className={c.alert ? "text-red-400" : "text-slate-200"}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <UserCircle2 className="size-3.5" /> Operator Session
            </p>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-slate-800">
                <UserCircle2 className="size-6 text-slate-500" />
              </div>
              <div className="font-mono text-[11px]">
                <p className="text-slate-200">J. Anderson</p>
                <p className="text-slate-500">OP-7842</p>
              </div>
              <ShieldCheck className="ml-auto size-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Shift Duration</span>
              <span className="text-slate-200">{formatShiftDuration(shiftSeconds)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Certification</span>
              <span className="text-amber-400">LEVEL 4</span>
            </div>
          </Card>
        </div>

        {/* CENTER: camera stage */}
        <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
          <div className="relative h-[38vh] min-h-[260px]">
            <CameraFeedPanel label="FRONT" size="large" videoSrc="/media/cockpit-feed.mp4" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CameraFeedPanel label="BACK" />
            <CameraFeedPanel label="REAR" videoSrc="/media/cockpit-feed.mp4" mirror />
            <LidarView />
          </div>
          <TruckSchematic />

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <MapPin className="size-3.5" /> Route Progress
            </p>
            <div className="flex items-center">
              {ROUTE_CHECKPOINTS.map((c, i) => (
                <Fragment key={c.label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        c.current ? "animate-pulse-dot bg-amber-500" : c.done ? "bg-amber-500" : "bg-slate-600"
                      )}
                    />
                    <span className="font-mono text-[9px] uppercase text-slate-400">{c.label}</span>
                  </div>
                  {i < ROUTE_CHECKPOINTS.length - 1 && (
                    <div className={cn("mx-1 h-px flex-1", c.done ? "bg-amber-500/60" : "bg-white/10")} />
                  )}
                </Fragment>
              ))}
            </div>

            <div className="mt-6 flex flex-col">
              <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
                <Gauge className="size-3.5" /> Speed Trend (60s)
              </p>
              <SpeedTrendChart data={SPEED_TREND} />
            </div>

            <div className="mt-6 flex flex-col">
              <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
                <BatteryMedium className="size-3.5" /> Battery Drain (60s)
              </p>
              <SpeedTrendChart data={BATTERY_TREND} max={100} unit="%" color="#22c55e" gradientId="batteryFill" />
            </div>
          </Card>
        </div>

        {/* RIGHT: control panel */}
        <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
          <ControlModeToggle mode={controlMode} onChange={setControlMode} />

          {controlMode === "keyboard" ? (
            <Card className="border border-white/10 bg-slate-900/60 p-4">
              <p className="mb-3 text-xs uppercase text-slate-400">Keyboard Input</p>
              <div className="flex items-center justify-center gap-2">
                {["w", "a", "s", "d"].map((k) => (
                  <div
                    key={k}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md border font-mono text-base uppercase transition-colors",
                      activeKeys.has(k)
                        ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                        : "border-white/20 text-slate-400"
                    )}
                  >
                    {k}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
                Prototype input — no hardware controller attached
              </p>
            </Card>
          ) : (
            <Card className="border border-white/10 bg-slate-900/60 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
                <Radio className="size-3.5" /> Hardware Controller
              </p>
              <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
                <span className="size-2 rounded-full bg-green-400" />
                <span className="font-mono text-xs text-green-300">CONTROLLER LINKED</span>
              </div>
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                Operating on physical control system input
              </p>
            </Card>
          )}

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <MapPin className="size-3.5" /> Mission
            </p>
            <div className="space-y-1 font-mono text-[11px] text-slate-300">
              <p>TARGET: Dumping Point B</p>
              <p>ETA: 7s</p>
              <p>DIST: 120cm</p>
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <SignalHigh className="size-3.5" /> Comms Signal
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-green-400">STRONG</p>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Terminal className="size-3.5" /> Command Log
            </p>
            <div className="max-h-32 space-y-1 overflow-y-auto font-mono text-[10px]">
              {COMMAND_LOG.map((c, i) => (
                <p key={i} className="text-slate-400">
                  <span className="text-slate-600">{c.time}</span>{" "}
                  <span className={c.type === "SYS" ? "text-amber-400" : "text-blue-400"}>{c.type}</span>{" "}
                  <span className="text-slate-300">→ {c.text}</span>
                </p>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Radio className="size-3.5" /> Radio / Comms
            </p>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Channel</span>
              <span className="rounded-md border border-white/10 bg-slate-950/60 px-2 py-0.5 text-amber-400">OPS-1</span>
            </div>
            <button
              type="button"
              onMouseDown={() => setPushToTalk(true)}
              onMouseUp={() => setPushToTalk(false)}
              onMouseLeave={() => setPushToTalk(false)}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors",
                pushToTalk
                  ? "border-amber-500 bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              )}
            >
              <Mic className="size-3.5" /> Push to Talk
            </button>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Users className="size-3 text-slate-500" /> {OTHER_OPERATORS.length} other operators online
            </div>
            <div className="mt-1 space-y-0.5 font-mono text-[10px] text-slate-400">
              {OTHER_OPERATORS.map((o) => (
                <p key={o.id} className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", o.online ? "bg-green-400" : "bg-slate-500")} />
                  {o.id} <span className="text-slate-600">{o.online ? "Online" : "Offline"}</span>
                </p>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase text-slate-400">
              <Hexagon className="size-3.5" /> Geofence / Zone Status
            </p>
            <p className="font-mono text-sm text-amber-400">ZONE 7 — HAUL ROAD</p>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Speed Limit</span>
              <span className="text-slate-200">20 cm/s</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Proximity</span>
              <span className="flex items-center gap-1 text-amber-400">
                25 m <AlertTriangle className="size-3.5" />
              </span>
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 text-xs uppercase text-slate-400">Quick Actions</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "headlights", label: "Headlights", icon: Lightbulb },
                { key: "horn", label: "Horn", icon: Volume2 },
                { key: "beacon", label: "Beacon", icon: Siren },
                { key: "wipers", label: "Wipers", icon: Droplets },
              ].map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleQuickAction(a.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border py-2 text-[9px] font-mono uppercase transition-colors",
                    quickActions[a.key]
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                      : "border-white/10 text-slate-500 hover:bg-white/5"
                  )}
                >
                  <a.icon className="size-4" />
                  {a.label}
                  <span className={quickActions[a.key] ? "text-green-400" : "text-slate-600"}>
                    {quickActions[a.key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-2 text-xs uppercase text-slate-400">Session Control</p>
            <button
              type="button"
              onClick={() => setSessionLocked((v) => !v)}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md border py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors",
                sessionLocked
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 text-slate-400 hover:bg-white/5"
              )}
            >
              <Lock className="size-3.5" /> {sessionLocked ? "Controls Locked" : "Lock Controls"}
            </button>
            <button
              type="button"
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:bg-white/5"
            >
              <UserCog className="size-3.5" /> Request Handoff
            </button>
          </Card>

          <button
            type="button"
            onClick={() => emitCommand("emergency_stop")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm font-bold uppercase tracking-wide transition-colors",
              spaceActive
                ? "border-red-500 bg-red-500/30 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                : "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            )}
          >
            <Octagon className="size-4" /> Emergency Stop
          </button>
        </div>
      </div>
    </div>
  );
}
