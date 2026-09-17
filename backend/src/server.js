import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { setupSocket } from "./socket/index.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin so phones on local IP can connect
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

const PORT = process.env.PORT || 3003;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.io relay server running on port ${PORT}`);
  console.log(
    `To connect from another device, use http://<your-local-ip>:${PORT}`,
  );
});
