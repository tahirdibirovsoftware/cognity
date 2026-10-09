"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
          <AlertTriangle className="size-5" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The page could not load. This usually happens when a request is too
            large or the connection drops. Your data is safe.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to workspace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
