import type { Server as IOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var io: IOServer | undefined;
}

export function getIO(): IOServer | undefined {
  return globalThis.io;
}

export function setIO(io: IOServer) {
  globalThis.io = io;
}

export const SYNC_ROOM = "sync:clinic";
