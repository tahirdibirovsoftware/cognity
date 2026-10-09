"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/app-shell/app-sidebar";
import { UserMenu } from "@/components/app-shell/user-menu";
import type { SessionUser } from "@/lib/session";

const SECTION_TITLES: Array<[string, string]> = [
  ["/manager/assessments/", "Assessment review"],
  ["/manager/assessments", "Assessments"],
  ["/manager/documents", "Documents"],
  ["/manager", "Compliance overview"],
  ["/employee/take/", "Assessment"],
  ["/results/", "Answer review"],
  ["/employee", "My training"],
];

export function AppHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const title =
    SECTION_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "Workspace";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
      <MobileNav role={user.role} />
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Cognity</span>
        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="truncate font-medium">{title}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          AI online
        </span>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
