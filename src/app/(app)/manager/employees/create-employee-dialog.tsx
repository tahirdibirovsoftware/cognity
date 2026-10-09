"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Key,
  Mail,
  User,
  UserPlus,
  Building2,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { createEmployeeAction, type ActionState } from "./actions";

type PublishedAssessment = {
  id: string;
  title: string;
  passingScore: number;
  documentTitle: string;
};

const initialState: ActionState = {};

export function CreateEmployeeDialog({
  publishedAssessments,
}: {
  publishedAssessments: PublishedAssessment[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createEmployeeAction, initialState);
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [department, setDepartment] = useState("Engineering");
  const [password, setPassword] = useState("welcome123");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Cognity Login Credentials\nEmail: ${email}\nPassword: ${password}\nURL: ${typeof window !== "undefined" ? window.location.origin : ""}/login`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          Add employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-brand" />
            Add new team member
          </DialogTitle>
          <DialogDescription>
            Create an account for an employee or manager. They can sign in at /login with their work email and initial password.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          ) : null}

          {state.success && state.message ? (
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
                className="mt-1 w-full gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied credentials
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
            <Label htmlFor="emp-name" className="text-xs font-medium">
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="emp-name"
                name="name"
                placeholder="e.g. John Doe"
                className="pl-9 text-sm"
                required
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-email" className="text-xs font-medium">
              Work email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="emp-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john.doe@company.com"
                className="pl-9 text-sm"
                required
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-dept" className="text-xs font-medium">
                Department
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="emp-dept"
                  name="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="pl-9 text-sm"
                  maxLength={60}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-role" className="text-xs font-medium">
                Role
              </Label>
              <select
                id="emp-role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="emp-pass" className="text-xs font-medium">
                Initial password
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Employee uses this to sign in
              </span>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="emp-pass"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="welcome123"
                className="pl-9 font-mono text-sm"
                required
                minLength={6}
                maxLength={60}
              />
            </div>
          </div>

          {role === "EMPLOYEE" && publishedAssessments.length > 0 ? (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="size-3.5 text-brand" />
                Assign initial compliance training (optional)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Immediately assign a published assessment so it appears on their dashboard upon login.
              </p>
              <select
                name="initialAssessmentId"
                defaultValue=""
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">None (assign later)</option>
                {publishedAssessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.passingScore}% pass mark)
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton pendingText="Creating…">
              <UserPlus className="size-4" />
              Create account
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
