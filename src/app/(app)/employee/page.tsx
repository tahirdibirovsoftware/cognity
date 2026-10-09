import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  GraduationCap,
  Gauge,
  PlayCircle,
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
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  assignmentStatusBadge,
  passFailBadge,
} from "@/components/status-badge";
import { formatDate, percent } from "@/lib/metrics";
import { getEmployeeAssignments } from "@/lib/queries";
import { requireEmployee } from "@/lib/session";

export const metadata: Metadata = {
  title: "My training",
};

export default async function EmployeeDashboardPage() {
  const user = await requireEmployee();
  const assignments = await getEmployeeAssignments(user.id);

  const pending = assignments.filter(
    (assignment) => assignment.status === "PENDING",
  );
  const graded = assignments.filter((assignment) => assignment.score !== null);
  const averageScore =
    graded.length > 0
      ? Math.round(
          graded.reduce((sum, assignment) => sum + (assignment.score ?? 0), 0) /
            graded.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My training"
        description={`Welcome back, ${user.name.split(" ")[0]}. Complete your assigned compliance training below.`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training assigned yet"
          description="When your manager assigns a compliance assessment, it will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Pending"
              value={String(pending.length)}
              hint="Assessments waiting for you"
              icon={CalendarClock}
              accent={pending.length > 0}
            />
            <StatCard
              label="Completed"
              value={String(graded.length)}
              hint={`${percent(graded.length, assignments.length)}% of your assignments`}
              icon={BadgeCheck}
              footer={
                <Progress
                  value={percent(graded.length, assignments.length)}
                  className="h-1.5"
                />
              }
            />
            <StatCard
              label="Average score"
              value={graded.length === 0 ? "—" : `${averageScore}%`}
              hint="Across completed assessments"
              icon={Gauge}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Assigned assessments</h2>
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="shadow-none">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {assignment.assessmentTitle}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                      <span>{assignment.passingScore}% required to pass</span>
                      <span>·</span>
                      <span>
                        {assignment.status === "COMPLETED"
                          ? `Completed ${formatDate(assignment.completedAt)}`
                          : `Due ${formatDate(assignment.dueAt)}`}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {assignment.status === "COMPLETED" &&
                    assignment.passed !== null
                      ? passFailBadge(assignment.passed)
                      : assignmentStatusBadge(assignment.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  {assignment.status === "COMPLETED" ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Score:{" "}
                        <span className="font-semibold text-foreground">
                          {assignment.score}%
                        </span>
                      </p>
                      {assignment.attemptId ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${assignment.attemptId}`}>
                            View feedback
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        AI-graded written answers · about 15 minutes
                      </p>
                      <Button size="sm" asChild>
                        <Link href={`/employee/take/${assignment.id}`}>
                          <PlayCircle className="size-4" />
                          Start assessment
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {pending.length === 0 && graded.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <BadgeCheck className="size-4 shrink-0" />
              All assigned training is complete.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
