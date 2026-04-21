import type { ReactNode } from "react";
import { WorkspaceHeader } from "./workspace-header";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div data-pme-theme-surface className="flex min-h-screen flex-col transition-colors duration-500 ease-out">
      <header className="sticky top-0 z-20 border-b border-brand-soft/60 bg-[var(--header-bg)] backdrop-blur-md transition-colors duration-500 ease-out dark:border-zinc-700/70">
        <WorkspaceHeader />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 transition-colors duration-500 ease-out sm:px-6">{children}</main>
    </div>
  );
}
