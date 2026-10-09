import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { confidenceBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

type ReviewQuestion = {
  id: string;
  position: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
  points: number;
};

type ReviewAnswer = {
  questionId: string;
  response: string;
  aiScore: number;
  aiFeedback: string;
  aiConfidence: string;
};

const TYPE_LABELS: Record<ReviewQuestion["type"], string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Written answer",
};

export function AnswerReview({
  questions,
  answers,
}: {
  questions: ReviewQuestion[];
  answers: ReviewAnswer[];
}) {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  return (
    <div className="space-y-4">
      {questions.map((question) => {
        const answer = answerMap.get(question.id);
        const isWritten = question.type === "SHORT_ANSWER";
        const isCorrect =
          !isWritten &&
          answer?.response.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase();

        return (
          <Card key={question.id} className="shadow-none">
            <CardHeader className="gap-3 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {question.position}
                </span>
                <Badge variant="outline" className="font-medium">
                  {TYPE_LABELS[question.type]}
                </Badge>
                <span
                  className={cn(
                    "ml-auto text-xs font-semibold tabular-nums",
                    answer && answer.aiScore >= question.points * 0.7
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {answer?.aiScore ?? 0} / {question.points} pts
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {question.prompt}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Your answer
                </p>
                <p className="leading-relaxed">
                  {answer?.response.trim() ? answer.response : "No answer"}{" "}
                  {!isWritten ? (
                    <span
                      className={cn(
                        "ml-1 text-xs font-semibold",
                        isCorrect
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {isCorrect ? "· Correct" : "· Incorrect"}
                    </span>
                  ) : null}
                </p>
              </div>

              {!isCorrect ? (
                <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    {isWritten ? "Model answer" : "Correct answer"}
                  </p>
                  <p className="leading-relaxed">{question.correctAnswer}</p>
                </div>
              ) : null}

              <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-brand dark:text-blue-300">
                    <Sparkles className="size-3.5" />
                    {isWritten ? "AI grading feedback" : "Auto-graded"}
                  </p>
                  {isWritten && answer ? (
                    confidenceBadge(answer.aiConfidence)
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {answer?.aiFeedback || "No feedback recorded."}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
