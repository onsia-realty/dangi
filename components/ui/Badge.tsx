import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "green" | "blue" | "gray" | "amber";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
