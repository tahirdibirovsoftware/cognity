import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Clock3,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

const FEATURES: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: FileCheck2,
    title: "Grounded in your policies",
    text: "Upload a PDF or paste text — questions come only from the document.",
  },
  {
    icon: Sparkles,
    title: "AI drafts and grades",
    text: "Rubrics, model answers, and per-answer feedback from DeepSeek.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable decisions",
    text: "Every AI grade carries a confidence level for compliance review.",
  },
  {
    icon: Clock3,
    title: "Hours back every cycle",
    text: "Authoring and grading drop from days of manual work to minutes.",
  },
];

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(user.role === "MANAGER" ? "/manager" : "/employee");

  return (
    <div className="flex min-h-svh">
      <aside className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-100 lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(59,130,246,0.22),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative">
          <Logo invert />
        </div>

        <div className="relative max-w-lg space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
              <Sparkles className="size-3.5 text-blue-400" />
              AI Enterprise Solutions
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Turn any policy into a compliance assessment in minutes.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Cognity takes the workflow HR teams run every quarter — reading a
              policy, writing a quiz, chasing completion, grading answers — and
              does it end to end.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <feature.icon className="size-4 text-blue-400" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {feature.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold tabular-nums">11.4 h</p>
            <p className="mt-1 text-xs text-zinc-400">
              manual work saved per 50-employee cycle
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold tabular-nums">94%</p>
            <p className="mt-1 text-xs text-zinc-400">
              compliance coverage after one cycle
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6 space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              Sign in to your workspace
            </h2>
            <p className="text-sm text-muted-foreground">
              Use a seeded demo account or your own credentials.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
