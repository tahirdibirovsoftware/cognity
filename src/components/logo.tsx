import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg shadow-sm",
          invert
            ? "bg-white text-zinc-950"
            : "bg-primary text-primary-foreground",
        )}
      >
        <ShieldCheck className="size-4.5" strokeWidth={2.2} />
      </div>
      <span className="font-display text-[22px] leading-none tracking-wide">
        Cognity
      </span>
    </div>
  );
}
