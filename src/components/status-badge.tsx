import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const toneClasses: Record<Tone, string> = {
  neutral:
    "border-border bg-muted text-muted-foreground dark:bg-muted/60",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300",
  brand:
    "border-brand/25 bg-brand/10 text-brand dark:text-blue-300",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 font-medium", toneClasses[tone], className)}
    >
      {label}
    </Badge>
  );
}

export function assessmentStatusBadge(status: "DRAFT" | "PUBLISHED") {
  return status === "PUBLISHED" ? (
    <StatusBadge label="Published" tone="success" />
  ) : (
    <StatusBadge label="Draft" tone="neutral" />
  );
}

export function passFailBadge(passed: boolean) {
  return passed ? (
    <StatusBadge label="Passed" tone="success" />
  ) : (
    <StatusBadge label="Not passed" tone="danger" />
  );
}

export function assignmentStatusBadge(status: "PENDING" | "COMPLETED") {
  return status === "COMPLETED" ? (
    <StatusBadge label="Completed" tone="success" />
  ) : (
    <StatusBadge label="Pending" tone="warning" />
  );
}

export function confidenceBadge(confidence: string) {
  const tone: Tone =
    confidence === "high" ? "success" : confidence === "medium" ? "warning" : "danger";
  return (
    <StatusBadge
      label={`${confidence[0]?.toUpperCase() ?? ""}${confidence.slice(1)} confidence`}
      tone={tone}
    />
  );
}
