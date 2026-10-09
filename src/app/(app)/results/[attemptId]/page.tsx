import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { passFailBadge } from "@/components/status-badge";
import { formatDate, percent } from "@/lib/metrics";
import { getAttemptDetail } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { AnswerReview } from "./answer-review";

export const metadata: Metadata = {
  title: "Answer review",
};

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  const attempt = await getAttemptDetail(attemptId);
  if (!attempt) notFound();

  const { assignment } = attempt;
  const isOwner = assignment.employeeId === user.id;
  if (user.role !== "MANAGER" && !isOwner) notFound();

  const questions = [...attempt.answers]
    .map((answer) => answer.question)
    .sort((a, b) => a.position - b.position);
  const totalPoints = questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );
  const earnedPoints = attempt.answers.reduce(
    (sum, answer) => sum + answer.aiScore,
    0,
  );
  const writtenAnswers = attempt.answers.filter(
    (answer) => answer.question.type === "SHORT_ANSWER",
  );
  const highConfidence = writtenAnswers.filter(
    (answer) => answer.aiConfidence === "high",
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={user.role === "MANAGER" ? "/manager" : "/employee"}>
            <ArrowLeft className="size-4" />
            {user.role === "MANAGER" ? "Back to dashboard" : "Back to my training"}
          </Link>
        </Button>
        <PageHeader
          title={assignment.assessment.title}
          description={`${assignment.employee.name} · submitted ${formatDate(attempt.submittedAt)}`}
        />
      </div>

      <Card className="shadow-none">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-semibold tabular-nums tracking-tight">
                {attempt.score}%
              </span>
              {passFailBadge(attempt.passed)}
            </div>
            <p className="text-sm text-muted-foreground">
              {attempt.passed
                ? `Passed — the ${assignment.assessment.passingScore}% threshold was met.`
                : `Not passed — ${assignment.assessment.passingScore}% is required. Review the feedback below.`}
            </p>
            <Progress value={attempt.score} className="h-2 max-w-md" />
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-1 sm:gap-2 sm:border-l sm:pl-6">
            <div>
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="text-sm font-semibold tabular-nums">
                {earnedPoints} / {totalPoints}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-sm font-semibold tabular-nums">
                {questions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pass threshold</p>
              <p className="text-sm font-semibold tabular-nums">
                {assignment.assessment.passingScore}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-brand" />
              AI grading summary
            </CardTitle>
            <CardDescription className="text-xs">
              {writtenAnswers.length === 0
                ? "This assessment was fully auto-graded from the answer key."
                : `${highConfidence} of ${writtenAnswers.length} written answers graded with high confidence.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={percent(highConfidence, writtenAnswers.length)}
              className="h-1.5"
            />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {attempt.passed ? (
                <Trophy className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BadgeCheck className="size-4 text-muted-foreground" />
              )}
              {attempt.passed ? "Training complete" : "Training outstanding"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3.5" />
              Submitted {formatDate(attempt.submittedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            This record is stored for compliance reporting and can be reviewed
            by an instructor or auditor.
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Answer review</h2>
        <AnswerReview
          questions={questions}
          answers={attempt.answers.map((answer) => ({
            questionId: answer.questionId,
            response: answer.response,
            aiScore: answer.aiScore,
            aiFeedback: answer.aiFeedback,
            aiConfidence: answer.aiConfidence,
          }))}
        />
      </div>
    </div>
  );
}
