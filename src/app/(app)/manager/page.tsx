import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Gauge,
  ShieldCheck,
  Sparkles,
  Users,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, passFailBadge } from "@/components/status-badge";
import {
  AUTHORING_MINUTES_PER_QUESTION,
  GRADING_MINUTES_PER_OPEN_ANSWER,
  formatDate,
  formatHours,
  hoursSaved,
  initials,
  percent,
} from "@/lib/metrics";
import { getManagerOverview } from "@/lib/queries";
import { requireManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Compliance overview",
};

export default async function ManagerDashboardPage() {
  await requireManager();
  const data = await getManagerOverview();

  const coverage = percent(data.completedCount, data.totalAssignments);
  const passRate = percent(data.passedCount, data.gradedCount);
  const saved = hoursSaved({
    questionCount: data.questionCount,
    openAnswersGraded: data.openAnswersGraded,
  });
  const highConfidenceShare = percent(
    data.highConfidence,
    data.totalAnswers,
  );

  if (data.publishedAssessmentCount === 0 && data.totalAssignments === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Compliance overview"
          description="Upload a policy, generate an assessment, and assign it to your team."
        />
        <EmptyState
          icon={Sparkles}
          title="No compliance assessments yet"
          description="Create your first assessment from a policy document. DeepSeek will draft the questions and grade every answer."
          action={
            <Button asChild>
              <Link href="/manager/documents">
                <Sparkles className="size-4" />
                Generate first assessment
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance overview"
        description="One workflow from policy document to graded, auditable results."
      >
        <Button asChild>
          <Link href="/manager/documents">
            <Sparkles className="size-4" />
            New assessment
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compliance coverage"
          value={`${coverage}%`}
          hint={`${data.completedCount} of ${data.totalAssignments} assignments completed`}
          icon={Users}
          footer={
            <Progress value={coverage} className="h-1.5" />
          }
        />
        <StatCard
          label="Hours saved"
          value={`${formatHours(saved)} h`}
          hint={`${AUTHORING_MINUTES_PER_QUESTION} min/question authored + ${GRADING_MINUTES_PER_OPEN_ANSWER} min/open answer graded`}
          icon={Clock3}
          accent
        />
        <StatCard
          label="Pass rate"
          value={`${passRate}%`}
          hint={`${data.passedCount} passed of ${data.gradedCount} graded`}
          icon={BadgeCheck}
          footer={<Progress value={passRate} className="h-1.5" />}
        />
        <StatCard
          label="Average score"
          value={`${data.averageScore}%`}
          hint={`Across ${data.gradedCount} submissions`}
          icon={Gauge}
          footer={<Progress value={data.averageScore} className="h-1.5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Recent submissions</CardTitle>
              <CardDescription>
                AI-graded, with per-answer feedback available.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/manager/assessments">
                View assessments
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {data.recent.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No submissions yet. Assign the assessment to employees to start
                collecting results.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Employee</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="pr-6 text-right">
                      Submitted
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent.map((row) => (
                    <TableRow key={row.assignmentId}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-muted text-[11px] font-semibold">
                              {initials(row.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <p className="text-sm font-medium">
                              {row.employeeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.employeeDepartment ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-sm">
                        {row.assessmentTitle}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">
                        {row.score}%
                      </TableCell>
                      <TableCell>
                        {row.passed !== null ? passFailBadge(row.passed) : null}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                        {row.attemptId ? (
                          <Link
                            href={`/results/${row.attemptId}`}
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {formatDate(row.submittedAt)}
                          </Link>
                        ) : (
                          formatDate(row.submittedAt)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-brand" />
                AI audit trail
              </CardTitle>
              <CardDescription>
                Decision transparency for compliance review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Questions generated
                </span>
                <span className="font-semibold tabular-nums">
                  {data.questionCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Answers graded</span>
                <span className="font-semibold tabular-nums">
                  {data.totalAnswers}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    High-confidence grades
                  </span>
                  <span className="font-semibold tabular-nums">
                    {highConfidenceShare}%
                  </span>
                </div>
                <Progress value={highConfidenceShare} className="h-1.5" />
              </div>
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                Every answer keeps the AI feedback and confidence level, so an
                auditor can review any grade later.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" />
                Awaiting completion
              </CardTitle>
              <CardDescription>
                {data.pending.length} pending assignment
                {data.pending.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Everyone is up to date. 
                </p>
              ) : (
                data.pending.slice(0, 4).map((row) => (
                  <div
                    key={row.assignmentId}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-muted text-[10px] font-semibold">
                          {initials(row.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-medium">
                          {row.employeeName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.assessmentTitle}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label="Pending" tone="warning" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
