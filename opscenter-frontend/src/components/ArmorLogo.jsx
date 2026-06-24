import armorLogo from "@/assets/armor-logo.jpeg";

export default function ArmorLogo({ className = "size-7" }) {
  return <img src={armorLogo} alt="A.R.M.O.R" className={`${className} rounded-md object-cover`} />;
}
