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
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">Cognity</span>
        <span
          className={cn(
            "mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em]",
            invert ? "text-zinc-400" : "text-muted-foreground",
          )}
        >
          Compliance AI
        </span>
      </div>
    </div>
  );
}
