export default function LandingLayout({ children }) {
  return (
    <div className="relative w-full overflow-x-hidden bg-[#050a14] text-white">
      <div className="grain-overlay fixed z-[1]" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
