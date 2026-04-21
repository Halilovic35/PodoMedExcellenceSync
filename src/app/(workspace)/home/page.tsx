import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, FileText, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Home · PodoMedExcellence Sync",
};

const tiles = [
  {
    href: "/appointments",
    label: "Appointments",
    sub: "Schedule",
    icon: CalendarDays,
    accent: "from-brand-soft to-white",
  },
  {
    href: "/documents",
    label: "Documents",
    sub: "Files",
    icon: FileText,
    accent: "from-white to-brand-soft",
  },
  {
    href: "/chat",
    label: "Chat",
    sub: "Messages",
    icon: MessageCircle,
    accent: "from-brand-muted/40 to-white",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-10 animate-fade-up">
      <div className="text-center sm:text-left space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Welcome</h1>
        <p className="text-ink-muted max-w-xl mx-auto sm:mx-0">
          Choose a workspace. Updates sync instantly for everyone signed in.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.accent} p-8 shadow-card ring-1 ring-brand-soft/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
            >
              <div className="flex flex-col items-center gap-5 text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/90 text-brand shadow-inner ring-1 ring-brand-soft transition group-hover:scale-105">
                  <Icon className="h-12 w-12" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <p className="font-display text-2xl text-ink">{tile.label}</p>
                  <p className="text-sm text-ink-muted mt-1">{tile.sub}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
