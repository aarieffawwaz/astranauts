import { useEffect, useState } from "react";
import Lenis from "lenis";

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

export default function LandingLayout({ children }) {
  const progress = useScrollProgress();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden bg-[#050a14] text-white">
      <div
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-amber-400"
        style={{ transform: `scaleX(${progress})`, transition: "transform 80ms linear" }}
      />
      <div className="grain-overlay fixed z-[1]" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
