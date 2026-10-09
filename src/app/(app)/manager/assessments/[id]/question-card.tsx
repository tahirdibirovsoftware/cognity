import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Question } from "@/db/schema";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<Question["type"], string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Written answer",
};

export function QuestionCard({
  question,
}: {
  question: Question;
}) {
  const isChoice = question.type === "MULTIPLE_CHOICE" && question.options;

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {question.position}
          </span>
          <Badge variant="outline" className="font-medium">
            {TYPE_LABELS[question.type]}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {question.points} pts
          </Badge>
        </div>
        <p className="text-sm font-medium leading-relaxed">{question.prompt}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isChoice ? (
          <ul className="space-y-1.5">
            {question.options?.map((option, index) => {
              const correct = option === question.correctAnswer;
              return (
                <li
                  key={option}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2",
                    correct
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40"
                      : "bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      correct
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 leading-snug">{option}</span>
                  {correct ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Model answer
            </p>
            <p className="leading-relaxed">{question.correctAnswer}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Grading rubric
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {question.rubric}
            </p>
          </div>
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-brand dark:text-blue-300">
              <Sparkles className="size-3.5" />
              AI rationale
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {question.rationale}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
