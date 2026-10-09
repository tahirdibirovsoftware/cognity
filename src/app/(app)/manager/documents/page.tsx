import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { assessmentStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/metrics";
import { getDocumentsWithAssessments } from "@/lib/queries";
import { requireManager } from "@/lib/session";
import { SAMPLE_POLICY, SAMPLE_POLICY_TITLE } from "@/lib/sample-policy";
import { DocumentForm } from "./document-form";

export const metadata: Metadata = {
  title: "Policy documents",
};

export default async function DocumentsPage() {
  await requireManager();
  const documents = await getDocumentsWithAssessments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy documents"
        description="Upload or paste a policy. Cognity generates the assessment from the document text."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-none lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-brand" />
              Create assessment from policy
            </CardTitle>
            <CardDescription>
              One document becomes one published assessment with question
              rubrics and audit rationale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentForm
              sampleTitle={SAMPLE_POLICY_TITLE}
              samplePolicy={SAMPLE_POLICY}
            />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your documents</h2>
            <span className="text-xs text-muted-foreground">
              {documents.length} total
            </span>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload a policy to start. The sample policy is a good place to see the full flow."
            />
          ) : (
            documents.map((document) => (
              <Card key={document.id} className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start gap-2 text-sm font-semibold">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {document.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {document.uploadedBy.name} · {formatDate(document.createdAt)}{" "}
                    · {document.content.length.toLocaleString()} chars
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {document.assessments.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No assessment generated yet
                    </span>
                  ) : (
                    document.assessments.map((assessment) => (
                      <Link
                        key={assessment.id}
                        href={`/manager/assessments/${assessment.id}`}
                        className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        {assessment.title}
                        {assessmentStatusBadge(assessment.status)}
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
