import { getIO, SYNC_ROOM } from "./socket-global";

export type SyncActorPayload = {
  actorUserId: string;
};

export function emitAppointmentsChanged(payload: SyncActorPayload) {
  getIO()?.to(SYNC_ROOM).emit("appointments:changed", payload);
}

export function emitDocumentsChanged(payload: SyncActorPayload) {
  getIO()?.to(SYNC_ROOM).emit("documents:changed", payload);
}

export function emitChatMessage(payload: unknown) {
  getIO()?.to(SYNC_ROOM).emit("chat:message", payload);
}
