import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { assessmentStatusBadge } from "@/components/status-badge";
import { formatDate, percent } from "@/lib/metrics";
import { getAssessmentsWithStats } from "@/lib/queries";
import { requireManager } from "@/lib/session";

export const metadata: Metadata = {
  title: "Assessments",
};

export default async function AssessmentsPage() {
  await requireManager();
  const assessments = await getAssessmentsWithStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Review, publish, and assign AI-generated compliance assessments."
      >
        <Button asChild>
          <Link href="/manager/documents">
            <Sparkles className="size-4" />
            New assessment
          </Link>
        </Button>
      </PageHeader>

      {assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Generate your first assessment from a policy document to see it here."
          action={
            <Button asChild>
              <Link href="/manager/documents">Go to policy documents</Link>
            </Button>
          }
        />
      ) : (
        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {assessments.length} assessment
              {assessments.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Assessment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Pass rate</TableHead>
                  <TableHead className="pr-6 text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/manager/assessments/${assessment.id}`}
                        className="group block max-w-72"
                      >
                        <span className="block truncate text-sm font-medium underline-offset-4 group-hover:underline">
                          {assessment.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {assessment.documentTitle}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {assessmentStatusBadge(assessment.status)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {assessment.questionCount}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {assessment.assignedCount}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {assessment.completedCount}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {assessment.completedCount === 0
                        ? "—"
                        : `${percent(assessment.passedCount, assessment.completedCount)}%`}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                      {formatDate(assessment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
