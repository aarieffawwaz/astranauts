import pamaLogo from "@/assets/pama-logo.png";

export default function PamaLogo({ className = "h-7 w-auto" }) {
  return <img src={pamaLogo} alt="PAMA member of ASTRA" className={`${className} object-contain`} />;
}
