import { AppHeader } from "@/components/app-shell/app-header";
import { DesktopSidebar } from "@/components/app-shell/app-sidebar";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh">
      <DesktopSidebar role={user.role} />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 bg-muted/30 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
