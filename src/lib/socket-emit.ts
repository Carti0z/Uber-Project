import { getIO } from "./socket-server";

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

function emitToRide(rideId: string, event: string, payload: RideSocketPayload) {
  getIO()?.to(`ride:${rideId}`).emit(event, payload);
}

function emitToUser(userId: string, event: string, payload: RideSocketPayload) {
  getIO()?.to(`user:${userId}`).emit(event, payload);
}

/** New ride request — notify online drivers and admins */
export function emitRideRequested(ride: Record<string, unknown>) {
  const rideId = ride.id as string;
  const payload: RideSocketPayload = {
    rideId,
    status: "REQUESTED",
    ride,
    riderId: ride.riderId as string,
    message: "New ride request",
  };
  getIO()?.to("drivers").emit("ride:requested", payload);
  getIO()?.to("admins").emit("ride:requested", payload);
}

/** Driver accepted ride — notify rider and admins */
export function emitRideAccepted(ride: Record<string, unknown>) {
  const rideId = ride.id as string;
  const riderId = ride.riderId as string;
  const driverId = ride.driverId as string;
  const payload: RideSocketPayload = {
    rideId,
    status: "DRIVER_ASSIGNED",
    ride,
    riderId,
    driverId,
    message: "Driver accepted your ride",
  };
  emitToUser(riderId, "ride:accepted", payload);
  emitToRide(rideId, "ride:status", payload);
  getIO()?.to("admins").emit("ride:accepted", payload);
  getIO()?.to("drivers").emit("ride:taken", { rideId, message: "Ride taken by another driver" });
}

/** Driver location update */
export function emitDriverLocation(
  rideId: string,
  data: {
    driverLat?: number | null;
    driverLng?: number | null;
    etaMinutes?: number | null;
    tripProgress?: number;
    riderId?: string;
  }
) {
  const payload: RideSocketPayload = {
    rideId,
    driverLat: data.driverLat,
    driverLng: data.driverLng,
    etaMinutes: data.etaMinutes,
    tripProgress: data.tripProgress,
    riderId: data.riderId,
    message: "Driver location updated",
  };
  emitToRide(rideId, "ride:location", payload);
  if (data.riderId) emitToUser(data.riderId, "ride:location", payload);
  getIO()?.to("admins").emit("ride:location", payload);
}

/** General ride status change */
export function emitRideStatusChange(ride: Record<string, unknown>) {
  const rideId = ride.id as string;
  const riderId = ride.riderId as string;
  const driverId = ride.driverId as string | undefined;
  const status = ride.status as string;
  const payload: RideSocketPayload = {
    rideId,
    status,
    ride,
    riderId,
    driverId,
    message: `Ride status: ${status}`,
  };
  emitToRide(rideId, "ride:status", payload);
  emitToUser(riderId, "ride:status", payload);
  if (driverId) emitToUser(driverId, "ride:status", payload);
  getIO()?.to("admins").emit("ride:status", payload);
}

/** Trip completed — notify rider, driver, admins */
export function emitRideCompleted(ride: Record<string, unknown>) {
  const rideId = ride.id as string;
  const riderId = ride.riderId as string;
  const driverId = ride.driverId as string | undefined;
  const payload: RideSocketPayload = {
    rideId,
    status: "COMPLETED",
    ride,
    riderId,
    driverId,
    message: "Trip completed",
  };
  emitToRide(rideId, "ride:completed", payload);
  emitToUser(riderId, "ride:completed", payload);
  if (driverId) emitToUser(driverId, "ride:completed", payload);
  getIO()?.to("admins").emit("ride:completed", payload);
  emitRideStatusChange(ride);
}
