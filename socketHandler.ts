// socketHandler.ts
import { Socket } from "socket.io";
export function handleSocketConnection(socket: Socket) {
  // Handle incoming messages from the client
  socket.on("message", (data) => {
    console.log("Received message from client:", data);
    // Echo the message back to the client
    socket.emit("message", `Server received: ${data}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
}