"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

export type RealtimeHandlers = {
  onAppointmentsChanged?: (payload?: { actorUserId?: string }) => void;
  onDocumentsChanged?: (payload?: { actorUserId?: string }) => void;
  onChatMessage?: (payload: unknown) => void;
};

type Subscriber = RealtimeHandlers;

export type WorkspaceRealtimeRegistry = {
  subscribe: (id: number, handlers: Subscriber) => void;
  unsubscribe: (id: number) => void;
};

const WorkspaceRealtimeContext = createContext<WorkspaceRealtimeRegistry | null>(null);

export function useWorkspaceRealtimeRegistry(): WorkspaceRealtimeRegistry | null {
  return useContext(WorkspaceRealtimeContext);
}

let nextSubscriberId = 1;

export function getNextRealtimeSubscriberId() {
  return nextSubscriberId++;
}

export function WorkspaceRealtimeProvider({ children }: { children: ReactNode }) {
  const subsRef = useRef(new Map<number, Subscriber>());

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    const broadcastAppt = (payload: unknown) => {
      const p = (payload ?? {}) as { actorUserId?: string };
      for (const h of Array.from(subsRef.current.values())) {
        h.onAppointmentsChanged?.(p);
      }
    };
    const broadcastDocs = (payload: unknown) => {
      const p = (payload ?? {}) as { actorUserId?: string };
      for (const h of Array.from(subsRef.current.values())) {
        h.onDocumentsChanged?.(p);
      }
    };
    const broadcastChat = (payload: unknown) => {
      for (const h of Array.from(subsRef.current.values())) {
        h.onChatMessage?.(payload);
      }
    };

    socket.on("appointments:changed", broadcastAppt);
    socket.on("documents:changed", broadcastDocs);
    socket.on("chat:message", broadcastChat);

    return () => {
      socket.off("appointments:changed", broadcastAppt);
      socket.off("documents:changed", broadcastDocs);
      socket.off("chat:message", broadcastChat);
      socket.disconnect();
    };
  }, []);

  const subscribe = useCallback((id: number, handlers: Subscriber) => {
    subsRef.current.set(id, handlers);
  }, []);

  const unsubscribe = useCallback((id: number) => {
    subsRef.current.delete(id);
  }, []);

  const value = useMemo<WorkspaceRealtimeRegistry>(
    () => ({ subscribe, unsubscribe }),
    [subscribe, unsubscribe],
  );

  return (
    <WorkspaceRealtimeContext.Provider value={value}>{children}</WorkspaceRealtimeContext.Provider>
  );
}
