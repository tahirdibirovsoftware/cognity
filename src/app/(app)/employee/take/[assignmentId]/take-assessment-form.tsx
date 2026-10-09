"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionType } from "@/db/schema";
import { percent } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { submitAttemptAction, type SubmitState } from "./actions";

type QuestionInput = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  points: number;
};

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Written answer",
};

const initialState: SubmitState = {};

export function TakeAssessmentForm({
  assignmentId,
  questions,
}: {
  assignmentId: string;
  questions: QuestionInput[];
}) {
  const [state, formAction, pending] = useActionState(
    submitAttemptAction,
    initialState,
  );
  const [responses, setResponses] = useState<Record<string, string>>({});

  const answered = questions.filter((question) =>
    responses[question.id]?.trim(),
  ).length;
  const progress = percent(answered, questions.length);
  const allAnswered = answered === questions.length;

  function setResponse(questionId: string, value: string) {
    setResponses((current) => ({ ...current, [questionId]: value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input
        type="hidden"
        name="responses"
        value={JSON.stringify(responses)}
      />

      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div className="space-y-4">
        {questions.map((question, index) => {
          const value = responses[question.id] ?? "";
          return (
            <Card key={question.id} className="shadow-none">
              <CardHeader className="gap-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <Badge variant="outline" className="font-medium">
                    {TYPE_LABELS[question.type]}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {question.points} pts
                  </Badge>
                  {value.trim() ? (
                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      Answered
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {question.prompt}
                </p>
              </CardHeader>
              <CardContent>
                {question.type === "SHORT_ANSWER" ? (
                  <Textarea
                    value={value}
                    onChange={(event) =>
                      setResponse(question.id, event.target.value)
                    }
                    placeholder="Write your answer, referencing the policy where relevant…"
                    className="min-h-28 resize-y"
                    maxLength={4000}
                  />
                ) : (
                  <RadioGroup
                    value={value}
                    onValueChange={(next) => setResponse(question.id, next)}
                    className="gap-2"
                  >
                    {(question.type === "TRUE_FALSE"
                      ? ["True", "False"]
                      : (question.options ?? [])
                    ).map((option, optionIndex) => {
                      const optionId = `${question.id}-${optionIndex}`;
                      const selected = value === option;
                      return (
                        <Label
                          key={option}
                          htmlFor={optionId}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-normal leading-snug transition-colors",
                            selected
                              ? "border-brand/40 bg-brand/5"
                              : "bg-muted/20 hover:bg-muted/50",
                          )}
                        >
                          <RadioGroupItem
                            id={optionId}
                            value={option}
                            className="shrink-0"
                          />
                          {question.type === "MULTIPLE_CHOICE" ? (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                          ) : null}
                          <span className="flex-1">{option}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-10">
        <Card className="border shadow-lg shadow-black/5">
          <CardContent className="flex items-center gap-4 py-3.5">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {answered} of {questions.length} answered
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
            <Button type="submit" disabled={!allAnswered || pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit for grading
            </Button>
          </CardContent>
        </Card>
      </div>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand/10">
                <Loader2 className="size-5 animate-spin text-brand" />
              </span>
              <p className="text-sm font-semibold">
                AI is grading your answers
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Multiple choice is checked instantly. Written answers are
                evaluated against the rubric — usually 10–20 seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </form>
  );
}
