import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Gamepad2,
  Navigation,
  GitFork,
  ArrowRight,
  Server,
  Cpu,
  BrainCircuit,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import LandingLayout from "@/pages/LandingLayout";
import PamaLogo from "@/components/PamaLogo";
import ArmorLogo from "@/components/ArmorLogo";
import IndonesiaMap from "@/components/IndonesiaMap";

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${visible ? "fade-up-in" : "fade-up-init"} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({ end, suffix = "", prefix = "", duration = 1400 }) {
  const [ref, visible] = useReveal();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, end, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

const TECH_GROUPS = [
  { label: "Frontend", icon: LayoutDashboard, items: ["React", "Socket.IO Client", "Leaflet"] },
  { label: "Backend & Realtime", icon: Server, items: ["Node.js + Express", "PostgreSQL", "Socket.IO", "JWT Auth"] },
  { label: "Hardware & Sensors", icon: Cpu, items: ["Raspberry Pi 5", "ESP32", "IMU + LiDAR", "GNSS RTK", "Mesh Network (BATMAN)"] },
  { label: "AI & Data", icon: BrainCircuit, items: ["RAG + pgvector", "Gemini API", "WebSocket Telemetry"] },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <LandingLayout>
      {/* NAVBAR */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 sm:px-10 ${
          scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <ArmorLogo className="size-8" />
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-wide text-amber-400">A.R.M.O.R</span>
            <span className="hidden text-xs text-slate-500 sm:inline">by Ayam Jago</span>
          </div>
          <span className="h-5 w-px bg-white/15" />
          <PamaLogo className="h-6 w-auto" />
        </div>
        <button
          onClick={() => navigate("/login")}
          className="btn-glow group flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400"
        >
          Enter OpsCenter
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(245,158,11,0.16), transparent 55%), radial-gradient(circle at 50% 90%, rgba(59,130,246,0.08), transparent 50%)",
          }}
        />

        <div className="fade-up-init fade-up-in relative z-10 max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Command Every Ton.
          </h1>
          <h1 className="mt-1 text-4xl font-light italic leading-[1.05] tracking-tight text-slate-200 sm:text-5xl lg:text-6xl">
            From Anywhere.
          </h1>

          <p className="mx-auto mt-8 max-w-lg text-base text-slate-400 sm:text-lg">
            A.R.M.O.R gives PAMA's supervisors god-mode visibility and operators
            real-time intelligence, eliminating the blind spots that cost billions.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="btn-glow flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400"
            >
              Enter OpsCenter <ArrowRight className="size-4" />
            </button>
            <a
              href="#how"
              className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Floating dashboard preview */}
        <div
          className="animate-float relative z-10 mt-16 w-full max-w-4xl"
          style={{ transform: "perspective(1000px) rotateX(8deg)" }}
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e] p-5 shadow-[0_30px_80px_-20px_rgba(245,158,11,0.25),0_30px_60px_-10px_rgba(0,0,0,0.6)]">
            <div className="grid grid-cols-4 gap-3">
              {["Active Units", "Avg Utilization", "Total Cycles", "Safety Score"].map((label, i) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-900/70 p-3 text-left">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {["3/3", "82%", "145", "98/100"][i]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-[2.3fr_1fr] gap-3">
              <div className="h-48 rounded-lg border border-white/10">
                <IndonesiaMap compact />
              </div>
              <div className="space-y-2 rounded-lg border border-white/10 bg-slate-900/70 p-3 text-left">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Leaderboard</p>
                {["Budi", "Sarif", "Agus"].map((n, i) => (
                  <div key={n} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">#{i + 1} {n}</span>
                    <span className="font-mono text-amber-400">{945 - i * 120}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-white/10 bg-black/30 py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {[
            { value: 50, prefix: "", suffix: "%", label: "Idle Time Reduced (28%→14%)" },
            { value: 130, prefix: "Rp ", suffix: "B+", label: "Net Benefit / Year" },
            { value: 100, prefix: "<", suffix: "ms", label: "Remote Control Latency" },
            { value: 13, prefix: "", suffix: "x", label: "Benefit-to-Cost Ratio" },
          ].map((s, i) => (
            <div key={i} className="relative text-center sm:border-l sm:border-white/10 sm:first:border-l-0">
              <p className="text-3xl font-extrabold text-amber-400 sm:text-4xl">
                <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OPERATIONAL AREA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="flex items-center gap-2 text-3xl font-bold sm:text-5xl">
            <MapPin className="size-7 text-amber-400" /> Our Operational Area
          </h2>
          <p className="mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
            PAMA runs heavy-equipment fleets across Sumatera, Kalimantan, Sulawesi, and Java.
            A.R.M.O.R is live at Berau Mine, Kalimantan Timur, PAMA's largest hauling operation.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <div className="h-[420px]">
            <IndonesiaMap />
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-6 flex flex-wrap gap-2">
          {["Sumatera Selatan", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Sulawesi", "Office"].map((r) => (
            <span
              key={r}
              className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300"
            >
              {r}
            </span>
          ))}
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-bold sm:text-5xl">
            One platform. Three layers of control.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Monitor,
              title: "Command Center",
              desc: "Supervisors get god-mode visibility: live fleet map, operator leaderboard, AI alerts, and instant dispatch.",
            },
            {
              icon: Gamepad2,
              title: "Remote Cockpit",
              desc: "Operators control from safety. Full keyboard drive, live camera feed, HUD telemetry, emergency stop.",
            },
            {
              icon: Navigation,
              title: "AI Navigator",
              desc: "Real-time co-pilot. Route optimization, fatigue alerts, cycle scoring, and RAG-powered mining SOP assistant.",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_20px_50px_-15px_rgba(245,158,11,0.25)]">
                <div
                  className="absolute -right-10 -top-10 size-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)" }}
                />
                <div className="relative flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.15)] transition-shadow group-hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                    <c.icon className="size-7 text-amber-400" />
                  </div>
                  <span className="font-mono text-3xl font-extrabold text-white/10">0{i + 1}</span>
                </div>
                <h3 className="relative mt-5 text-lg font-bold text-white">{c.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-red-500/20 bg-red-950/20 p-7">
              <h3 className="text-2xl font-bold text-white">
                PAMA loses billions to invisible inefficiencies
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                {[
                  "Fleet idle time 20-30% of operating hours: fuel burning, zero output",
                  "Supervisors blind without physical pit presence",
                  "Operators fly on instinct, deviating from mine plan",
                  "Incidents go undetected until shift-end reports",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="h-full rounded-2xl border border-amber-500/20 bg-amber-950/10 p-7">
              <h3 className="text-2xl font-bold text-white">
                A.R.M.O.R makes every blind spot visible
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                {[
                  "Real-time fleet telemetry: every unit, every 200ms",
                  "Remote Operation Center from any location",
                  "In-session operator scoring and live guidance",
                  "AI alert system triggers on anomaly, not after",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING / DEPLOYMENT */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">From pilot to site-wide deployment</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Evidence-based rollout: validate on 10 units before committing to the full fleet.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { label: "Pilot Package", price: "Rp 2.25B", desc: "10 units · 3-month validation" },
            { label: "Full Deployment", price: "Rp 22.73B", desc: "100 units · 1-year rollout", highlight: true },
            { label: "Continuity Plan", price: "Rp 3.62B", desc: "per year · maintenance & support" },
          ].map((p) => (
            <Reveal key={p.label}>
              <div
                className={`h-full rounded-2xl border p-6 ${
                  p.highlight
                    ? "border-amber-500/50 bg-amber-500/[0.06] shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{p.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">{p.price}</p>
                <p className="mt-2 text-sm text-slate-400">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-20">
        <Reveal className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Built on production-grade infrastructure</h2>
        </Reveal>
        <div className="mx-auto mt-8 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {TECH_GROUPS.map((g, i) => (
            <Reveal key={g.label} delay={i * 100}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2.5">
                  <g.icon className="size-5 text-amber-400" />
                  <p className="text-sm font-semibold text-white">{g.label}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {g.items.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-amber-500/20 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-amber-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="text-3xl font-bold sm:text-5xl">Three dashboards. One unified command.</h2>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {[
            {
              label: "Supervisor",
              content: (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-6 rounded bg-slate-800/80" />
                    ))}
                  </div>
                  <div className="armor-grid-bg mt-2 h-20 rounded bg-slate-950/80" />
                </>
              ),
            },
            {
              label: "Cockpit",
              content: (
                <>
                  <div className="relative flex h-20 items-center justify-center overflow-hidden rounded border border-white/10 bg-black">
                    <video
                      className="absolute inset-0 size-full object-cover opacity-80"
                      src="/media/cockpit-feed.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 text-[10px] text-red-500">
                      <span className="animate-blink size-1.5 rounded-full bg-red-500" /> LIVE
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {["W", "A", "S", "D"].map((k) => (
                      <span key={k} className="flex size-6 items-center justify-center rounded border border-white/20 text-[10px] text-slate-400">
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              ),
            },
            {
              label: "Navigator",
              content: (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-20 rounded bg-slate-950/80 armor-dot-grid-bg" />
                    <div className="space-y-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-3.5 rounded bg-slate-800/80" />
                      ))}
                    </div>
                  </div>
                </>
              ),
            },
          ].map((m, i) => (
            <Reveal key={m.label} delay={i * 120}>
              <div className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <div className="mb-2 flex gap-1.5">
                  <span className="size-2 rounded-full bg-red-500/60" />
                  <span className="size-2 rounded-full bg-amber-500/60" />
                  <span className="size-2 rounded-full bg-green-500/60" />
                </div>
                {m.content}
              </div>
              <p className="mt-3 text-center text-sm font-medium text-slate-400">{m.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.18), transparent 60%)" }}
        />
        <Reveal className="relative z-10">
          <h2 className="text-4xl font-extrabold sm:text-6xl">The pit is dangerous.</h2>
          <h2 className="mt-1 text-4xl font-light italic text-slate-300 sm:text-6xl">The ROC is the future.</h2>
          <p className="mx-auto mt-6 max-w-lg text-slate-400">
            A.R.M.O.R is PAMA's first step toward a fully remote, AI-guided mining operation.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm italic text-slate-500">
            "Puts the supervisor in command and the operator in safety from anywhere."
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-glow mx-auto mt-9 flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-base font-semibold text-slate-950 transition-all hover:bg-amber-400"
          >
            Enter OpsCenter <ArrowRight className="size-4" />
          </button>
          <p className="mt-6 text-xs text-slate-600">
            Proposed by Ayam Jago · Astranauts 2026 · PAMA Challenge
          </p>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-8 text-xs text-slate-500 sm:flex-row">
        <span className="flex items-center gap-2">
          <PamaLogo className="size-5" /> A.R.M.O.R © 2026
        </span>
        <span>Built for PT Pamapersada Nusantara</span>
        <a
          href="https://github.com/aarieffawwaz/astranauts"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 hover:text-slate-300"
        >
          <GitFork className="size-3.5" /> GitHub
        </a>
      </footer>
    </LandingLayout>
  );
}
