const BASE_FARE = parseFloat(process.env.NEXT_PUBLIC_BASE_FARE || "2.5");
const PER_KM = parseFloat(process.env.NEXT_PUBLIC_PER_KM_RATE || "1.2");
const PER_MIN = parseFloat(process.env.NEXT_PUBLIC_PER_MIN_RATE || "0.25");

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDurationMin(distanceKm: number): number {
  const avgSpeedKmh = 30;
  return Math.max(5, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export function calculateFare(distanceKm: number, durationMin: number): number {
  const fare = BASE_FARE + distanceKm * PER_KM + durationMin * PER_MIN;
  return Math.round(fare * 100) / 100;
}

export const COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || process.env.NEXT_PUBLIC_COMMISSION_RATE || "0.15"
);

export function getDriverEarningsFromRide(ride: {
  driverEarnings?: number | null;
  finalFare?: number | null;
  estimatedFare: number;
}) {
  if (ride.driverEarnings != null) return ride.driverEarnings;
  return splitFare(ride.finalFare ?? ride.estimatedFare).driverEarnings;
}

export function getPlatformCommissionFromRide(ride: {
  platformCommission?: number | null;
  finalFare?: number | null;
  estimatedFare: number;
}) {
  if (ride.platformCommission != null) return ride.platformCommission;
  return splitFare(ride.finalFare ?? ride.estimatedFare).platformCommission;
}

export function splitFare(totalFare: number, rate = COMMISSION_RATE) {
  const platformCommission = Math.round(totalFare * rate * 100) / 100;
  const driverEarnings = Math.round((totalFare - platformCommission) * 100) / 100;
  return {
    totalFare,
    platformCommission,
    driverEarnings,
    commissionRate: rate,
    commissionPercent: Math.round(rate * 100),
  };
}

export function estimateRide(
  pickupLat: number,
  pickupLng: number,
  destLat: number,
  destLng: number
) {
  const distanceKm = Math.round(haversineKm(pickupLat, pickupLng, destLat, destLng) * 100) / 100;
  const durationMin = estimateDurationMin(distanceKm);
  const estimatedFare = calculateFare(distanceKm, durationMin);
  const { platformCommission, driverEarnings, commissionPercent } = splitFare(estimatedFare);
  return {
    distanceKm,
    durationMin,
    estimatedFare,
    platformCommission,
    driverEarnings,
    commissionPercent,
  };
}
