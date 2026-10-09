"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Key, AlertCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { resetEmployeePasswordAction, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ResetPasswordDialog({
  employeeId,
  employeeName,
  employeeEmail,
}: {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("welcome123");
  const [copied, setCopied] = useState(false);
  const [state, formAction] = useActionState(
    resetEmployeePasswordAction,
    initialState,
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Cognity Login Credentials\nEmail: ${employeeEmail}\nPassword: ${password}\nURL: ${window.location.origin}/login`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-muted-foreground hover:text-foreground"
          title={`Reset password for ${employeeName}`}
        >
          <Key className="size-3.5" />
          <span className="sr-only">Reset password</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5 text-brand" />
            Reset Employee Password
          </DialogTitle>
          <DialogDescription>
            Assign a new password for {employeeName} ({employeeEmail}).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={employeeId} />

          {state.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          ) : null}

          {state.success ? (
            <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{state.message}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="mt-2 w-full gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy credentials
                  </>
                )}
              </Button>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={`reset-pwd-${employeeId}`} className="text-xs font-medium">
              New Password
            </Label>
            <Input
              id={`reset-pwd-${employeeId}`}
              name="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono text-sm"
              required
              minLength={6}
              maxLength={60}
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum 6 characters. Standard default is &quot;welcome123&quot;.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <SubmitButton pendingText="Updating…">
              <Key className="size-4" />
              Update password
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
