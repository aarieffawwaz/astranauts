import { cn } from "@/lib/utils";

const CORNER = "absolute size-3 border-amber-500/50";

export default function CameraFeedPanel({ label, size = "default", className, videoSrc, mirror = false }) {
  const isLarge = size === "large";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-slate-900",
        isLarge ? "h-full" : "aspect-video",
        className
      )}
    >
      {videoSrc ? (
        <video
          className={cn("absolute inset-0 size-full object-cover", mirror && "-scale-x-100")}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        /* grey modern placeholder mesh — stands in for AI-generated replay footage */
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
          <div className="armor-dot-grid-bg absolute inset-0 opacity-30" />
        </>
      )}
      <div className="scanline-overlay" />

      {/* HUD corner brackets */}
      <div className={cn(CORNER, "left-2 top-2 border-l-2 border-t-2")} />
      <div className={cn(CORNER, "right-2 top-2 border-r-2 border-t-2")} />
      <div className={cn(CORNER, "bottom-2 left-2 border-b-2 border-l-2")} />
      <div className={cn(CORNER, "bottom-2 right-2 border-b-2 border-r-2")} />

      <div className="absolute left-2 top-2 flex items-center gap-1.5 text-[10px] font-mono text-red-500">
        <span className="animate-blink size-1.5 rounded-full bg-red-500" />
        REC
      </div>
      <div className="absolute right-2 top-2 font-mono text-[10px] font-semibold tracking-wide text-amber-400">
        {label}
      </div>

      {!videoSrc && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-2">
          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide text-slate-400 backdrop-blur-sm">
            AI replay pending — signal placeholder
          </span>
        </div>
      )}
    </div>
  );
}
