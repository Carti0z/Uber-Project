import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { COMMISSION_RATE, getPlatformCommissionFromRide } from "@/lib/fare";

const ACTIVE_STATUSES = ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [
    totalRiders,
    totalDrivers,
    totalTrips,
    completedTrips,
    activeTrips,
    cancelledTrips,
    revenueAgg,
    recentRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RIDER" } }),
    prisma.user.count({ where: { role: "DRIVER" } }),
    prisma.ride.count(),
    prisma.ride.count({ where: { status: "COMPLETED" } }),
    prisma.ride.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.ride.count({ where: { status: "CANCELLED" } }),
    prisma.ride.findMany({
      where: { status: "COMPLETED", paymentStatus: "COMPLETED" },
      select: {
        finalFare: true,
        estimatedFare: true,
        platformCommission: true,
      },
    }),
    prisma.ride.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: {
        completedAt: true,
        finalFare: true,
        estimatedFare: true,
        platformCommission: true,
      },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  const paidTrips = revenueAgg.length;
  const totalCommission = Math.round(
    revenueAgg.reduce((s, r) => s + getPlatformCommissionFromRide(r), 0) * 100
  ) / 100;
  const grossTripVolume = Math.round(
    revenueAgg.reduce((s, r) => s + (r.finalFare ?? r.estimatedFare), 0) * 100
  ) / 100;

  const dailyRevenue: { date: string; revenue: number; trips: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const dayTrips = recentRevenue.filter((r) => {
      if (!r.completedAt) return false;
      const t = new Date(r.completedAt);
      return t >= d && t < next;
    });

    dailyRevenue.push({
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      revenue: Math.round(
        dayTrips.reduce((s, r) => s + getPlatformCommissionFromRide(r), 0) * 100
      ) / 100,
      trips: dayTrips.length,
    });
  }

  return NextResponse.json({
    totalRiders,
    totalDrivers,
    totalTrips,
    completedTrips,
    activeTrips,
    cancelledTrips,
    totalRevenue: totalCommission,
    grossTripVolume,
    commissionPercent: Math.round(COMMISSION_RATE * 100),
    paidTrips,
    dailyRevenue,
  });
}
