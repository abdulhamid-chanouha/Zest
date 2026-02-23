import Link from "next/link";
import { Sparkles } from "lucide-react";

import { SidebarNav } from "@/components/sidebar-nav";
import { TopSearch } from "@/components/top-search";
import { UserMenu } from "@/components/user-menu";
import type { User } from "@/types";

type AppShellProps = {
  user: User;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zest-glow">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-3 py-4 sm:px-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm backdrop-blur md:flex md:flex-col">
          <Link href="/recipes" className="mb-6 flex items-center gap-2 px-2">
            <div className="rounded-lg bg-yellow-100 p-2 text-yellow-900">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Zest</p>
              <p className="text-xs text-muted-foreground">Recipe workspace</p>
            </div>
          </Link>
          <SidebarNav />
          <p className="mt-auto px-2 text-xs text-muted-foreground">Fresh planning. Practical cooking.</p>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-4 z-20 mb-5 rounded-2xl border border-border/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="md:hidden">
                <Link href="/recipes" className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-yellow-700" />
                  Zest
                </Link>
              </div>
              <TopSearch />
              <div className="ml-auto">
                <UserMenu user={user} />
              </div>
            </div>
            <div className="mt-3 md:hidden">
              <SidebarNav />
            </div>
          </header>

          <main className="pb-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
