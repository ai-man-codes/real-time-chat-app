import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = 4000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Track connected users: socketId -> { username, id }
const connectedUsers = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins with username
    socket.on("userJoin", (username) => {
      const user = { username, id: socket.id };
      connectedUsers.set(socket.id, user);

      // Notify everyone about new user
      io.emit("userJoined", { user, users: Array.from(connectedUsers.values()) });
      console.log(`${username} joined. Total users: ${connectedUsers.size}`);
    });

    // Handle chat messages — broadcast to all (sender already has it locally)
    socket.on("sendMessage", (message) => {
      // Broadcast to everyone EXCEPT sender (sender already added locally)
      socket.broadcast.emit("receiveMessage", message);
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      socket.broadcast.emit("userTyping", data);
    });

    socket.on("stopTyping", (data) => {
      socket.broadcast.emit("userStopTyping", data);
    });

    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        io.emit("userLeft", { user, users: Array.from(connectedUsers.values()) });
        console.log(`${user.username} left. Total users: ${connectedUsers.size}`);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
