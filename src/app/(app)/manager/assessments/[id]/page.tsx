import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Send,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import {
  assessmentStatusBadge,
  assignmentStatusBadge,
  passFailBadge,
} from "@/components/status-badge";
import { formatDate, initials, percent } from "@/lib/metrics";
import { getAssessmentDetail } from "@/lib/queries";
import { requireManager } from "@/lib/session";
import { assignToAllAction, publishAssessmentAction } from "../actions";
import { QuestionCard } from "./question-card";
import { retryGenerationAction } from "../../documents/actions";

export const metadata: Metadata = {
  title: "Assessment review",
};

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generation?: string }>;
}) {
  await requireManager();
  const { id } = await params;
  const query = await searchParams;

  const data = await getAssessmentDetail(id);
  if (!data) notFound();

  const { assessment, questions, assignments, employeeCount } = data;
  const generationFailed = query.generation === "failed";
  const hasQuestions = questions.length > 0;
  const totalPoints = questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );
  const completed = assignments.filter(
    (assignment) => assignment.status === "COMPLETED",
  );
  const passed = completed.filter((assignment) => assignment.passed === true);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/manager/assessments">
            <ArrowLeft className="size-4" />
            All assessments
          </Link>
        </Button>
        <PageHeader
          title={assessment.title}
          description={`From “${assessment.document.title}” · created by ${assessment.createdBy.name} · ${formatDate(assessment.createdAt)}`}
        >
          {generationFailed || !hasQuestions ? (
            <form action={retryGenerationAction}>
              <input
                type="hidden"
                name="assessmentId"
                value={assessment.id}
              />
              <SubmitButton pendingText="Generating…">
                <Sparkles className="size-4" />
                Retry generation
              </SubmitButton>
            </form>
          ) : null}

          {hasQuestions && assessment.status === "DRAFT" ? (
            <form action={publishAssessmentAction}>
              <input
                type="hidden"
                name="assessmentId"
                value={assessment.id}
              />
              <SubmitButton pendingText="Publishing…">
                <Send className="size-4" />
                Publish assessment
              </SubmitButton>
            </form>
          ) : null}

          {hasQuestions &&
          assessment.status === "PUBLISHED" &&
          assignments.length < employeeCount ? (
            <form action={assignToAllAction}>
              <input
                type="hidden"
                name="assessmentId"
                value={assessment.id}
              />
              <SubmitButton variant="outline" pendingText="Assigning…">
                <UserPlus className="size-4" />
                Assign to all employees
              </SubmitButton>
            </form>
          ) : null}
        </PageHeader>
      </div>

      {generationFailed ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">AI generation failed.</p>
            <p className="mt-0.5 text-destructive/80">
              The document was saved. Retry generation — DeepSeek occasionally
              times out on long documents.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {assessmentStatusBadge(assessment.status)}
        {hasQuestions ? (
          <>
            <span>·</span>
            <span>
              {questions.length} questions · {totalPoints} points
            </span>
            <span>·</span>
            <span>{assessment.passingScore}% to pass</span>
          </>
        ) : null}
        {assessment.publishedAt ? (
          <>
            <span>·</span>
            <span>Published {formatDate(assessment.publishedAt)}</span>
          </>
        ) : null}
      </div>

      {hasQuestions ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Assessment questions</h2>
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      ) : !generationFailed ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No questions generated yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This draft has no questions. Retry generation to recreate them
              from the source document.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {assessment.status === "PUBLISHED" ? (
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Assignments</CardTitle>
              <CardDescription>
                {assignments.length === 0
                  ? "Not assigned yet."
                  : `${completed.length} of ${assignments.length} completed · ${percent(passed.length, completed.length)}% pass rate`}
              </CardDescription>
            </div>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  Assign this assessment to every employee. They will see it in
                  their training list immediately.
                </p>
                <form action={assignToAllAction}>
                  <input
                    type="hidden"
                    name="assessmentId"
                    value={assessment.id}
                  />
                  <SubmitButton variant="outline" pendingText="Assigning…">
                    <UserPlus className="size-4" />
                    Assign to all employees
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="pr-6 text-right">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-muted text-[11px] font-semibold">
                              {initials(assignment.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <p className="text-sm font-medium">
                              {assignment.employeeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.employeeDepartment ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignmentStatusBadge(assignment.status)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {assignment.score !== null
                          ? `${assignment.score}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {assignment.passed !== null
                          ? passFailBadge(assignment.passed)
                          : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(assignment.dueAt)}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                        {assignment.attemptId ? (
                          <Link
                            href={`/results/${assignment.attemptId}`}
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {formatDate(assignment.submittedAt)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
