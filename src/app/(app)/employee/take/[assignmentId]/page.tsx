import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ClipboardList, Clock3, Target } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/metrics";
import { getAssignmentForEmployee } from "@/lib/queries";
import { requireEmployee } from "@/lib/session";
import { TakeAssessmentForm } from "./take-assessment-form";

export const metadata: Metadata = {
  title: "Assessment",
};

export const maxDuration = 60;

export default async function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await requireEmployee();
  const { assignmentId } = await params;

  const data = await getAssignmentForEmployee(assignmentId, user.id);
  if (!data) notFound();

  const { assignment, questions } = data;
  const attempt = assignment.attempts[0];
  if (assignment.status === "COMPLETED" && attempt) {
    redirect(`/results/${attempt.id}`);
  }

  const totalPoints = questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Compliance training · {user.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {assignment.assessment.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ClipboardList className="size-3.5" />
            {questions.length} questions · {totalPoints} points
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="size-3.5" />
            {assignment.assessment.passingScore}% to pass
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            Due {formatDate(assignment.dueAt)}
          </span>
        </div>
      </div>

      <Card className="border-brand/20 bg-brand/5 shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-sm">Before you start</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Answers are graded automatically: multiple choice and true/false
            instantly, written answers by AI against the policy rubric. You can
            only submit once.
          </CardDescription>
        </CardHeader>
      </Card>

      <TakeAssessmentForm
        assignmentId={assignment.id}
        questions={questions.map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options,
          points: question.points,
        }))}
      />
    </div>
  );
}
