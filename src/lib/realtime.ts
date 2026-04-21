import { getIO, SYNC_ROOM } from "./socket-global";

export function emitAppointmentsChanged() {
  getIO()?.to(SYNC_ROOM).emit("appointments:changed");
}

export function emitDocumentsChanged() {
  getIO()?.to(SYNC_ROOM).emit("documents:changed");
}

export function emitChatMessage(payload: unknown) {
  getIO()?.to(SYNC_ROOM).emit("chat:message", payload);
}
