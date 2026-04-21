"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export type RealtimeHandlers = {
  onAppointmentsChanged?: () => void;
  onDocumentsChanged?: () => void;
  onChatMessage?: (payload: unknown) => void;
};

export function useRealtime(handlers: RealtimeHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    const onAppt = () => ref.current.onAppointmentsChanged?.();
    const onDocs = () => ref.current.onDocumentsChanged?.();
    const onChat = (payload: unknown) => ref.current.onChatMessage?.(payload);

    socket.on("appointments:changed", onAppt);
    socket.on("documents:changed", onDocs);
    socket.on("chat:message", onChat);

    return () => {
      socket.off("appointments:changed", onAppt);
      socket.off("documents:changed", onDocs);
      socket.off("chat:message", onChat);
      socket.disconnect();
    };
  }, []);
}
