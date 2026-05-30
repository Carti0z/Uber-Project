import type { Server as SocketIOServer } from "socket.io";

declare global {
  var _moveeIO: SocketIOServer | undefined;
}

export function setIO(io: SocketIOServer) {
  global._moveeIO = io;
}

export function getIO(): SocketIOServer | null {
  return global._moveeIO ?? null;
}
