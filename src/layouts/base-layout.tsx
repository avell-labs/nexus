import React from "react";
import DragWindowRegion from "@/components/drag-window-region";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthStatus } from "@/types/auth";

export default function BaseLayout({
  children,
  authStatus,
  forceSidebar = false,
}: {
  children: React.ReactNode;
  authStatus: AuthStatus | null;
  forceSidebar?: boolean;
}) {
  const showSidebar = forceSidebar || Boolean(authStatus?.isAuthenticated);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion />
      {showSidebar ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarProvider className="h-full w-full !min-h-0 overflow-hidden">
            <AppSidebar authUser={authStatus?.user ?? null} />
            <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
              <header className="bg-background/80 flex h-10 shrink-0 items-center border-b px-2">
                <SidebarTrigger />
              </header>
              <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
            </div>
          </SidebarProvider>
        </div>
      ) : (
        <main className="min-h-0 flex-1 overflow-hidden p-2">{children}</main>
      )}
    </div>
  );
}
