import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export const RIDE_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Finding driver",
  DRIVER_ASSIGNED: "Driver assigned",
  DRIVER_ARRIVING: "Driver arriving",
  IN_PROGRESS: "Trip in progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const RIDER_BOOKING_STEPS = [
  "Pickup",
  "Destination",
  "Fare estimate",
  "Request ride",
];

export const RIDER_TRIP_STEPS = [
  "Requested",
  "Driver accepts",
  "Track driver",
  "In progress",
  "Complete",
  "Rate driver",
];

export const DRIVER_FLOW_STEPS = [
  "Go online",
  "Receive request",
  "Accept ride",
  "Navigate",
  "Start trip",
  "End trip",
  "Earnings",
];

export function riderBookingStep(step: number): number {
  return Math.min(Math.max(step, 1), RIDER_BOOKING_STEPS.length);
}

export function riderTripStep(status: string, rated: boolean): number {
  if (rated) return 6;
  switch (status) {
    case "REQUESTED":
      return 1;
    case "DRIVER_ASSIGNED":
      return 2;
    case "DRIVER_ARRIVING":
      return 3;
    case "IN_PROGRESS":
      return 4;
    case "COMPLETED":
      return 5;
    default:
      return 1;
  }
}

export function driverFlowStep(
  isOnline: boolean,
  hasActiveRide: boolean,
  status?: string
): number {
  if (!isOnline) return 1;
  if (!hasActiveRide) return 2;
  switch (status) {
    case "DRIVER_ASSIGNED":
      return 4;
    case "DRIVER_ARRIVING":
      return 4;
    case "IN_PROGRESS":
      return 5;
    case "COMPLETED":
      return 7;
    default:
      return 3;
  }
}

