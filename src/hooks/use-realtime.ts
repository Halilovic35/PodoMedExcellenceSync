"use client";

import { useEffect, useRef } from "react";
import {
  getNextRealtimeSubscriberId,
  useWorkspaceRealtimeRegistry,
  type RealtimeHandlers,
} from "@/context/workspace-realtime-provider";

export type { RealtimeHandlers } from "@/context/workspace-realtime-provider";

export function useRealtime(handlers: RealtimeHandlers) {
  const registry = useWorkspaceRealtimeRegistry();
  const idRef = useRef<number | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!registry) return;

    if (idRef.current === null) {
      idRef.current = getNextRealtimeSubscriberId();
    }
    const id = idRef.current;

    const subscriber: RealtimeHandlers = {
      onAppointmentsChanged: (p) => handlersRef.current.onAppointmentsChanged?.(p),
      onDocumentsChanged: (p) => handlersRef.current.onDocumentsChanged?.(p),
      onChatMessage: (p) => handlersRef.current.onChatMessage?.(p),
    };

    registry.subscribe(id, subscriber);
    return () => registry.unsubscribe(id);
  }, [registry]);
}
