import { Keyboard, Radio } from "lucide-react";

export default function ControlModeToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-slate-950/80 p-0.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onChange("keyboard")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
          mode === "keyboard" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/10"
        }`}
      >
        <Keyboard className="size-3.5" /> KEYBOARD (PROTOTYPE)
      </button>
      <button
        type="button"
        onClick={() => onChange("real")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
          mode === "real" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/10"
        }`}
      >
        <Radio className="size-3.5" /> REAL CONTROL SYSTEM
      </button>
    </div>
  );
}
