export const AUTHORING_MINUTES_PER_QUESTION = 6;
export const GRADING_MINUTES_PER_OPEN_ANSWER = 4;

export function hoursSaved(input: {
  questionCount: number;
  openAnswersGraded: number;
}): number {
  const minutes =
    input.questionCount * AUTHORING_MINUTES_PER_QUESTION +
    input.openAnswersGraded * GRADING_MINUTES_PER_OPEN_ANSWER;
  return minutes / 60;
}

export function formatHours(hours: number): string {
  if (hours >= 10) return hours.toFixed(0);
  return hours.toFixed(1);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
