import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl leading-none tracking-wide",
        className,
      )}
    >
      Cognity
    </span>
  );
}
