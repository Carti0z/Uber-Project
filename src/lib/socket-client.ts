"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket/io",
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type RideSocketEvent =
  | "ride:requested"
  | "ride:accepted"
  | "ride:location"
  | "ride:status"
  | "ride:completed"
  | "ride:taken";

export interface RideSocketPayload {
  rideId: string;
  status?: string;
  ride?: Record<string, unknown>;
  driverLat?: number | null;
  driverLng?: number | null;
  etaMinutes?: number | null;
  tripProgress?: number;
  riderId?: string;
  driverId?: string;
  message?: string;
}
