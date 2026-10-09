"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import type { Role } from "@/db/schema";
import { NavLinks } from "./nav-links";

function SidebarFooter() {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="size-3.5 text-brand" />
        AI assistant active
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        DeepSeek drafts questions and grades open answers with an auditable
        trail.
      </p>
    </div>
  );
}

export function DesktopSidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
      <Logo />
      <div className="mt-8 flex-1">
        <NavLinks role={role} />
      </div>
      <SidebarFooter />
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col px-4 py-5">
          <Logo />
          <div className="mt-8 flex-1">
            <NavLinks role={role} onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter />
        </div>
      </SheetContent>
    </Sheet>
  );
}
