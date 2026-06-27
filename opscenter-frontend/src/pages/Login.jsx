import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Gamepad2, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import ArmorLogo from "@/components/ArmorLogo";
import rocImage from "@/assets/roc image.jpeg";

const ROLES = {
  supervisor: {
    label: "Supervisor / Fleet Manager",
    icon: Monitor,
    desc: "Oversee operations, manage fleet performance, and monitor site activity.",
    features: ["Fleet Overview", "Task Management", "Performance Analytics", "Alerts & Reports"],
    username: "supervisor",
    password: "supervisor123",
    redirect: "/supervisor",
  },
  operator: {
    label: "Remote Operator",
    icon: Gamepad2,
    desc: "Operate rover systems remotely and respond to real-time tasks.",
    features: ["Remote Control", "Live Telemetry", "Camera Feeds", "System Diagnostics"],
    username: "operator1",
    password: "operator123",
    redirect: "/cockpit",
  },
};

export default function Login() {
  const [selected, setSelected] = useState("supervisor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleEnter() {
    const role = ROLES[selected];
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", {
        username: role.username,
        password: role.password,
      });
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      navigate(role.redirect);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0f1e] p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] md:grid-cols-2">
        {/* LEFT: rover image */}
        <div className="relative hidden min-h-[560px] md:block">
          <img src={rocImage} alt="ARMOR mining operation rover" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0f1e]/70 via-[#0a0f1e]/10 to-transparent" />
        </div>

        {/* RIGHT: role picker */}
        <div className="flex flex-col p-7 lg:p-10">
          <div className="flex items-center gap-3">
            <ArmorLogo className="size-10" />
            <span className="h-9 w-px bg-white/15" />
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(245,158,11,0.5)]">ARMOR</h1>
              <p className="text-xs text-slate-400">AI-Relay Mining Operation Rover</p>
            </div>
          </div>

          <h2 className="mt-8 text-2xl font-semibold text-white">Welcome</h2>
          <p className="mt-1 text-sm text-slate-400">Select your role to access your operational dashboard</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(ROLES).map(([key, role]) => {
              const Icon = role.icon;
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "flex flex-col rounded-xl border p-5 text-left transition-all",
                    active
                      ? "border-amber-500 bg-amber-500/[0.06] shadow-[0_0_24px_rgba(245,158,11,0.2)]"
                      : "border-white/10 bg-slate-900/40 hover:border-white/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-amber-500/15 text-amber-400" : "bg-slate-800/80 text-slate-400"
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">{role.label}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{role.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className={cn("size-3.5 shrink-0", active ? "text-amber-400" : "text-slate-500")} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleEnter}
            disabled={loading}
            className="btn-glow mt-6 h-12 w-full bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Enter OpsCenter <ArrowRight className="size-4" /></span>
            )}
          </Button>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ArmorLogo className="size-4" /> Secure. Intelligent. Reliable.
            </span>
            <span>© {new Date().getFullYear()} ARMOR OpsCenter. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
