import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_WS_URL, {
  autoConnect: false,
});

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!socket.connected) {
    socket.connect();
  }
  if (token) {
    socket.emit("auth:login", { token });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
