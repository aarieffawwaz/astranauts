import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function chatBubbleClass(role) {
  return role === "user"
    ? "self-end rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm text-blue-200 max-w-[80%]"
    : "self-start rounded-lg bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 max-w-[80%]";
}
