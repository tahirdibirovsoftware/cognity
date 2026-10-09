"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: Record<Role, NavItem[]> = {
  MANAGER: [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/manager/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/manager/documents", label: "Documents", icon: FileText },
  ],
  EMPLOYEE: [
    { href: "/employee", label: "My training", icon: GraduationCap, exact: true },
  ],
};

export function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS[role].map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                active
                  ? "text-brand"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {item.label}
            {active ? (
              <span className="ml-auto size-1.5 rounded-full bg-brand" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
