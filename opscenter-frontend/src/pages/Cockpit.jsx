import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Compass, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

const ROBOT_ID = 1;
const ROBOT_NAME = "HD-001";
const KEYS = ["w", "a", "s", "d"];

export default function Cockpit() {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState({
    battery_level: 85,
    speed: 18,
    distance_to_obstacle: 45,
    status: "moving",
  });
  const [activeKeys, setActiveKeys] = useState(new Set());

  useEffect(() => {
    connectSocket();
    const onTelemetry = ({ robot, telemetry: t }) => {
      if (robot !== ROBOT_NAME) return;
      setTelemetry((prev) => ({ ...prev, ...t }));
    };
    socket.on("telemetry:update", onTelemetry);

    function emitCommand(command) {
      socket.emit("robot:command", {
        robot_id: ROBOT_ID,
        command,
        parameters: {},
        control_token: localStorage.getItem("control_token") || "",
      });
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
      socket.off("telemetry:update", onTelemetry);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      disconnectSocket();
    };
  }, []);

  const spaceActive = activeKeys.has("space");
  const distSafe = (telemetry.distance_to_obstacle ?? 45) > 30;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 p-4 text-white">
      <header className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/supervisor")}>
            <ArrowLeft className="mr-1 size-4" /> Supervisor
          </Button>
          <span className="font-mono text-lg font-bold text-amber-400">{ROBOT_NAME}</span>
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

      <div className="relative mx-auto mt-6 flex h-[55vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
        <video
          className="absolute inset-0 size-full object-cover"
          src="/media/cockpit-feed.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="scanline-overlay" />
        <svg viewBox="0 0 200 200" className="relative size-2/3 opacity-40">
          <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="100" x2="40" y2="200" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="100" x2="160" y2="200" stroke="white" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="2" fill="white" />
        </svg>
        <div className="absolute right-4 top-4 flex items-center gap-2 text-xs font-mono text-red-500">
          <span className="animate-blink size-2 rounded-full bg-red-500" />
          {ROBOT_NAME}
        </div>
      </div>

      <div className="mx-auto mt-3 w-full max-w-4xl text-center text-sm font-mono text-slate-300">
        TARGET: Dumping Point B &nbsp;|&nbsp; ETA: 7s &nbsp;|&nbsp; DIST: 120cm
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-4xl grid-cols-2 gap-3">
        <Card className="border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Speed</p>
          <p className="text-2xl font-bold text-white">{Math.round(telemetry.speed ?? 0)} cm/s</p>
          <Progress value={Math.min(100, (telemetry.speed ?? 0) * 4)} className="mt-2 h-1.5" />
        </Card>
        <Card className="border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Distance</p>
          <p className="text-2xl font-bold text-white">
            {Math.round(telemetry.distance_to_obstacle ?? 45)}cm{" "}
            <span className={distSafe ? "text-green-400" : "text-red-400"}>
              {distSafe ? "SAFE" : "DANGER"}
            </span>
          </p>
        </Card>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-4xl items-center justify-center gap-2">
        {["w", "a", "s", "d"].map((k) => (
          <div
            key={k}
            className={cn(
              "flex size-12 items-center justify-center rounded-md border font-mono text-lg uppercase transition-colors",
              activeKeys.has(k)
                ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                : "border-white/20 text-slate-400"
            )}
          >
            {k}
          </div>
        ))}
        <div
          className={cn(
            "ml-4 flex items-center gap-2 rounded-md border px-4 py-3 font-mono text-sm uppercase transition-colors",
            spaceActive
              ? "border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.7)]"
              : "border-red-500/40 text-red-400"
          )}
        >
          SPACEBAR: EMERGENCY STOP
        </div>
      </div>
    </div>
  );
}
