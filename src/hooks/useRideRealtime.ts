"use client";

import { useEffect } from "react";
import { useSocketOptional } from "@/components/providers/SocketProvider";
import type { RideSocketEvent, RideSocketPayload } from "@/lib/socket-client";

export function useRideRealtime(
  options: {
    rideId?: string;
    onUpdate?: () => void;
    events?: RideSocketEvent[];
  } = {}
) {
  const socket = useSocketOptional();
  const {
    rideId,
    onUpdate,
    events = ["ride:accepted", "ride:location", "ride:status", "ride:completed"],
  } = options;

  useEffect(() => {
    if (!socket || !onUpdate) return;

    const unsubscribers = events.map((event) =>
      socket.subscribe(event, (payload: RideSocketPayload) => {
        if (rideId && payload.rideId !== rideId) return;
        onUpdate();
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [socket, rideId, onUpdate, events]);

  useEffect(() => {
    if (!socket || !rideId) return;
    socket.joinRide(rideId);
    return () => socket.leaveRide(rideId);
  }, [socket, rideId]);
}
