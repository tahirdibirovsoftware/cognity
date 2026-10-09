import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { assessmentStatusBadge } from "@/components/status-badge";
import { formatBytes, formatDate } from "@/lib/metrics";
import { getDocumentsWithAssessments } from "@/lib/queries";
import { requireManager } from "@/lib/session";
import { SAMPLE_POLICY, SAMPLE_POLICY_TITLE } from "@/lib/sample-policy";
import { generateFromDocumentAction } from "./actions";
import { DocumentForm } from "./document-form";

export const metadata: Metadata = {
  title: "Documents",
};

export const maxDuration = 120;

export default async function DocumentsPage() {
  await requireManager();
  const documents = await getDocumentsWithAssessments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload and store PDF documents in object storage. Cognity generates assessments from document text."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-none lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-brand" />
              Upload document or create assessment
            </CardTitle>
            <CardDescription>
              Upload a PDF up to 50 MB to securely store in object storage and generate
              assessments with question rubrics.
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
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-2">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    {document.fileKey ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/documents/${document.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="size-3.5" />
                          Original file
                          {document.fileSize
                            ? ` · ${formatBytes(document.fileSize)}`
                            : ""}
                        </a>
                      </Button>
                    ) : null}
                    <form action={generateFromDocumentAction}>
                      <input
                        type="hidden"
                        name="documentId"
                        value={document.id}
                      />
                      <SubmitButton
                        variant="outline"
                        size="sm"
                        pendingText="Generating…"
                      >
                        <Sparkles className="size-3.5" />
                        New assessment
                      </SubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
