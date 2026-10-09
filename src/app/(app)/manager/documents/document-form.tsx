"use client";

import { useActionState, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Info,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
  X,
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

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_CHARS = 30_000;
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setClientError(null);
      return;
    }

    const name = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      event.target.value = "";
      setSelectedFile(null);
      setClientError(
        "Unsupported file type. Upload a PDF, TXT, or Markdown file.",
      );
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      event.target.value = "";
      setSelectedFile(null);
      setClientError(
        `“${file.name}” is ${formatBytes(file.size)} — the maximum upload size is 4 MB. Compress the file or paste the policy text instead.`,
      );
      return;
    }

    setSelectedFile({ name: file.name, size: file.size });
    setClientError(null);
  }

  function clearSelectedFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
    setClientError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const file = fileInputRef.current?.files?.[0];
    if (!file || file.size === 0) return;

    if (file.size > MAX_FILE_BYTES) {
      event.preventDefault();
      setClientError(
        `“${file.name}” is ${formatBytes(file.size)} — the maximum upload size is 4 MB. Compress the file or paste the policy text instead.`,
      );
    }
  }

  const error = clientError ?? state.error;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
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

      <Tabs
        defaultValue="paste"
        onValueChange={() => setClientError(null)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1">
            <FileText className="size-3.5" />
            Paste text
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">
            <Upload className="size-3.5" />
            Upload file
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
            maxLength={MAX_TEXT_CHARS}
          />
          <p className="text-right text-xs tabular-nums text-muted-foreground">
            {content.length.toLocaleString()} /{" "}
            {MAX_TEXT_CHARS.toLocaleString()} characters
          </p>
        </TabsContent>

        <TabsContent value="upload" className="mt-3 space-y-3">
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">
                Maximum file size: 4 MB.
              </span>{" "}
              Accepted formats: PDF, TXT, and Markdown. Larger files are
              rejected before upload — compress them or paste the text instead.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Policy file</Label>
            <Input
              id="file"
              name="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              className="file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium"
            />
          </div>

          {selectedFile ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {selectedFile.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatBytes(selectedFile.size)}
              </span>
              <button
                type="button"
                onClick={clearSelectedFile}
                aria-label="Remove selected file"
                className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Text is extracted from the file and stored in your workspace
              database. The original file is not kept.
            </p>
          )}
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
