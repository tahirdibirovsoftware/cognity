"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </Button>

      <div className="relative py-2">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          or demo access
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="submit"
          name="demo"
          value="manager"
          variant="outline"
          formNoValidate
          disabled={pending}
        >
          Sign in as Manager
        </Button>
        <Button
          type="submit"
          name="demo"
          value="employee"
          variant="outline"
          formNoValidate
          disabled={pending}
        >
          Sign in as Employee
        </Button>
      </div>

      <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
        Seeded accounts:{" "}
        <span className="font-medium text-foreground">manager@cognity.demo</span>{" "}
        or{" "}
        <span className="font-medium text-foreground">
          employee@cognity.demo
        </span>{" "}
        · password <span className="font-mono text-foreground">demo1234</span>
      </p>
    </form>
  );
}
