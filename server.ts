import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setIO } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Server error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: dev ? true : process.env.NEXT_PUBLIC_APP_URL || true,
      methods: ["GET", "POST"],
    },
  });

  setIO(io);

  io.on("connection", (socket) => {
    socket.on(
      "join",
      (data: { userId?: string; role?: string; rideId?: string }) => {
        if (data.userId) socket.join(`user:${data.userId}`);
        if (data.role === "DRIVER") socket.join("drivers");
        if (data.role === "ADMIN") socket.join("admins");
        if (data.role === "RIDER") socket.join("riders");
        if (data.rideId) socket.join(`ride:${data.rideId}`);
      }
    );

    socket.on("join_ride", (rideId: string) => {
      if (rideId) socket.join(`ride:${rideId}`);
    });

    socket.on("leave_ride", (rideId: string) => {
      if (rideId) socket.leave(`ride:${rideId}`);
    });
  });

  httpServer
    .once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error(err);
      }
      process.exit(1);
    })
    .listen(port, dev ? hostname : "0.0.0.0", () => {
      const url = dev ? `http://${hostname}:${port}` : `http://0.0.0.0:${port}`;
      console.log(`> Movee ready on ${url}`);
      console.log(`> Socket.io on path /api/socket/io`);
    });
});
