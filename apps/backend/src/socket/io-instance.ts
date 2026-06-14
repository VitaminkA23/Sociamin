import type { ChatServer } from "./socket.server.js";

let _io: ChatServer | null = null;

export function setIo(io: ChatServer): void {
  _io = io;
}

export function getIo(): ChatServer {
  if (_io === null) throw new Error("[socket] io not initialized");
  return _io;
}
