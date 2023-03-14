import { io } from "socket.io-client";
import { start } from "./game";

export const socket = io(location.href.replaceAll("5173", "3000"), {
  transports: ["websocket"],
});

socket.on("connect", () => {
  start();
});

socket.on("error", (e) => {
  console.error(e);
});

socket.on("connect_error", (e) => console.error(e));
