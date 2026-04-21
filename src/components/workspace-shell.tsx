import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-brand-soft/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/home" className="flex items-center gap-3 shrink-0">
              <span className="relative h-11 w-11 overflow-hidden rounded-full shadow-card ring-2 ring-brand-soft">
                <Image
                  src="/LOGO.png"
                  alt="PodoMed Excellence"
                  fill
                  className="object-cover"
                  sizes="44px"
                  priority
                />
              </span>
              <div className="min-w-0 hidden sm:block">
                <p className="font-display text-lg leading-tight text-brand-dark tracking-tight">
                  PodoMedExcellence
                </p>
                <p className="text-xs text-ink-muted">Sync</p>
              </div>
            </Link>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
