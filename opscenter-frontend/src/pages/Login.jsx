import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Gamepad2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const ROLES = {
  supervisor: {
    label: "Supervisor / Fleet Manager",
    icon: Monitor,
    username: "supervisor",
    password: "supervisor123",
    redirect: "/supervisor",
  },
  operator: {
    label: "Remote Operator",
    icon: Gamepad2,
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0f1e]">
      <Card className="w-[420px] border border-white/10 bg-slate-900/80 p-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]">
          ARMOR
        </h1>
        <p className="mt-2 text-sm text-slate-400">AI-Relay Mining Operation Rover</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {Object.entries(ROLES).map(([key, role]) => {
            const Icon = role.icon;
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl border px-4 py-8 transition-all",
                  active
                    ? "border-amber-500 bg-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                    : "border-white/10 bg-slate-900/40 hover:border-white/20"
                )}
              >
                <Icon className={cn("size-10", active ? "text-amber-400" : "text-slate-400")} />
                <span className="text-sm font-medium text-white">{role.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        <Button
          onClick={handleEnter}
          disabled={loading}
          className="mt-6 h-11 w-full bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : "Enter OpsCenter"}
        </Button>
      </Card>
    </div>
  );
}
