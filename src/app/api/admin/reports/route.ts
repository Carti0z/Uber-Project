import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  COMMISSION_RATE,
  getDriverEarningsFromRide,
  getPlatformCommissionFromRide,
} from "@/lib/fare";

export async function GET() {
  try {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    allRides,
    completedRides,
    cancelledRides,
    newRiders,
    newDrivers,
    ratedRides,
    completedWithDriver,
  ] = await Promise.all([
    prisma.ride.count(),
    prisma.ride.findMany({
      where: { status: "COMPLETED" },
      select: {
        finalFare: true,
        estimatedFare: true,
        platformCommission: true,
        driverEarnings: true,
        paymentMethod: true,
        completedAt: true,
        distanceKm: true,
      },
    }),
    prisma.ride.count({ where: { status: "CANCELLED" } }),
    prisma.user.count({ where: { role: "RIDER", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: "DRIVER", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.ride.findMany({
      where: { rating: { not: null } },
      select: { rating: true },
    }),
    prisma.ride.findMany({
      where: { status: "COMPLETED", driverId: { not: null } },
      select: {
        driverId: true,
        finalFare: true,
        estimatedFare: true,
        platformCommission: true,
        driverEarnings: true,
        driver: { select: { name: true } },
      },
    }),
  ]);

  const grossVolume = completedRides.reduce(
    (s, r) => s + (r.finalFare ?? r.estimatedFare),
    0
  );
  const totalCommission = completedRides.reduce(
    (s, r) => s + getPlatformCommissionFromRide(r),
    0
  );
  const totalDriverPayouts = completedRides.reduce(
    (s, r) => s + getDriverEarningsFromRide(r),
    0
  );
  const avgFare =
    completedRides.length > 0 ? grossVolume / completedRides.length : 0;
  const avgDistance =
    completedRides.length > 0
      ? completedRides.reduce((s, r) => s + r.distanceKm, 0) / completedRides.length
      : 0;
  const completionRate =
    allRides > 0 ? Math.round((completedRides.length / allRides) * 100) : 0;
  const cancellationRate =
    allRides > 0 ? Math.round((cancelledRides / allRides) * 100) : 0;
  const avgRating =
    ratedRides.length > 0
      ? ratedRides.reduce((s, r) => s + (r.rating || 0), 0) / ratedRides.length
      : 0;

  const cashTrips = completedRides.filter((r) => r.paymentMethod === "CASH").length;
  const cardTrips = completedRides.filter((r) => r.paymentMethod === "CARD").length;

  const monthlyTrips: { month: string; trips: number; revenue: number; commission: number }[] =
    [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthRides = completedRides.filter((r) => {
      if (!r.completedAt) return false;
      const t = new Date(r.completedAt);
      return t >= d && t < next;
    });
    monthlyTrips.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      trips: monthRides.length,
      revenue: Math.round(
        monthRides.reduce((s, r) => s + (r.finalFare ?? r.estimatedFare), 0) * 100
      ) / 100,
      commission: Math.round(
        monthRides.reduce((s, r) => s + getPlatformCommissionFromRide(r), 0) * 100
      ) / 100,
    });
  }

  const driverAgg: Record<string, { name: string; trips: number; earnings: number }> = {};
  for (const ride of completedWithDriver) {
    if (!ride.driverId) continue;
    if (!driverAgg[ride.driverId]) {
      driverAgg[ride.driverId] = {
        name: ride.driver?.name || "Unknown",
        trips: 0,
        earnings: 0,
      };
    }
    driverAgg[ride.driverId].trips += 1;
    driverAgg[ride.driverId].earnings += getDriverEarningsFromRide(ride);
  }

  const topDrivers = Object.values(driverAgg)
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 5)
    .map((d) => ({
      name: d.name,
      trips: d.trips,
      earnings: Math.round(d.earnings * 100) / 100,
    }));

  return NextResponse.json({
    summary: {
      totalRevenue: Math.round(totalCommission * 100) / 100,
      grossTripVolume: Math.round(grossVolume * 100) / 100,
      totalDriverPayouts: Math.round(totalDriverPayouts * 100) / 100,
      commissionPercent: Math.round(COMMISSION_RATE * 100),
      avgFare: Math.round(avgFare * 100) / 100,
      avgDistance: Math.round(avgDistance * 100) / 100,
      completionRate,
      cancellationRate,
      avgRating: Math.round(avgRating * 10) / 10,
      newRiders30d: newRiders,
      newDrivers30d: newDrivers,
    },
    paymentBreakdown: { cash: cashTrips, card: cardTrips },
    monthlyTrips,
    topDrivers,
  });
  } catch (err) {
    console.error("Admin reports error:", err);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
