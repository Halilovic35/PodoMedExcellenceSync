import type { ReactNode } from "react";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceShellClient } from "./workspace-shell-client";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShellClient>
      <div
        data-pme-theme-surface
        className="flex min-h-screen min-h-[100dvh] flex-col transition-colors duration-500 ease-out"
      >
        <header className="sticky top-0 z-20 border-b border-brand-soft/60 bg-[var(--header-bg)] backdrop-blur-md transition-colors duration-500 ease-out dark:border-zinc-700/70">
          <WorkspaceHeader />
        </header>
        <main className="mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col px-3 py-6 transition-colors duration-500 ease-out sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </WorkspaceShellClient>
  );
}
