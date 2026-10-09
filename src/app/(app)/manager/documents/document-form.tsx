"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  generateAssessmentAction,
  type GenerateState,
} from "./actions";

const initialState: GenerateState = {};

export function DocumentForm({
  sampleTitle,
  samplePolicy,
}: {
  sampleTitle: string;
  samplePolicy: string;
}) {
  const [state, formAction, pending] = useActionState(
    generateAssessmentAction,
    initialState,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Assessment title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Annual Information Security Compliance"
          maxLength={160}
        />
      </div>

      <Tabs defaultValue="paste">
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1">
            <FileText className="size-3.5" />
            Paste text
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">
            <Upload className="size-3.5" />
            Upload PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Policy text</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setTitle(sampleTitle);
                setContent(samplePolicy);
              }}
            >
              <Wand2 className="size-3.5" />
              Use sample policy
            </Button>
          </div>
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste the full policy document here…"
            className="min-h-52 resize-y font-mono text-xs leading-relaxed"
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-3 space-y-2">
          <Label htmlFor="file">Policy file</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            className="file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            PDF, TXT, or Markdown · up to 8 MB. Text is extracted and stored in
            your workspace database.
          </p>
        </TabsContent>
      </Tabs>

      <div className="space-y-3 border-t pt-4">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {pending ? "Generating assessment…" : "Generate assessment"}
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {pending
            ? "Reading policy → drafting questions → writing rubrics and rationale. This takes about 30–60 seconds."
            : "DeepSeek drafts 6 grounded questions with rubrics. You review before publishing."}
        </p>
      </div>
    </form>
  );
}
