"use client";

import type { ReactNode } from "react";
import { WorkspaceRealtimeProvider } from "@/context/workspace-realtime-provider";
import { NotificationsProvider } from "@/context/notifications-provider";

export function WorkspaceShellClient({ children }: { children: ReactNode }) {
  return (
    <WorkspaceRealtimeProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </WorkspaceRealtimeProvider>
  );
}
