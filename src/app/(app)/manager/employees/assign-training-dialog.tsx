"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  ClipboardList,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import {
  assignAssessmentToEmployeeAction,
  type ActionState,
} from "./actions";

type PublishedAssessment = {
  id: string;
  title: string;
  passingScore: number;
  documentTitle: string;
};

const initialState: ActionState = {};

export function AssignTrainingDialog({
  employeeId,
  employeeName,
  assignedAssessmentIds,
  publishedAssessments,
}: {
  employeeId: string;
  employeeName: string;
  assignedAssessmentIds: string[];
  publishedAssessments: PublishedAssessment[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    assignAssessmentToEmployeeAction,
    initialState,
  );

  const availableAssessments = publishedAssessments.filter(
    (a) => !assignedAssessmentIds.includes(a.id),
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Send className="size-3.5" />
          Assign training
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-brand" />
            Assign training to {employeeName}
          </DialogTitle>
          <DialogDescription>
            Select a published compliance assessment. It will immediately appear on this employee&apos;s training portal.
          </DialogDescription>
        </DialogHeader>

        {availableAssessments.length === 0 ? (
          <div className="rounded-lg border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
            All currently published assessments have already been assigned to {employeeName}.
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="employeeId" value={employeeId} />

            {state.error ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : null}

            {state.success && state.message ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="mt-0.5 size-4 shrink-0" />
                <span>{state.message}</span>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="assign-assessment" className="text-xs font-medium">
                Published assessment
              </Label>
              <select
                id="assign-assessment"
                name="assessmentId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {availableAssessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} · {a.passingScore}% pass mark ({a.documentTitle})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign-days" className="text-xs font-medium">
                Due timeline
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <select
                  id="assign-days"
                  name="dueDays"
                  defaultValue="14"
                  className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="7">7 days from now</option>
                  <option value="14">14 days from now (Standard)</option>
                  <option value="30">30 days from now</option>
                  <option value="60">60 days from now</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton pendingText="Assigning…">
                <Send className="size-3.5" />
                Confirm assignment
              </SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
