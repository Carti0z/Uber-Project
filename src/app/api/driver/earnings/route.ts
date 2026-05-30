import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMISSION_RATE, getDriverEarningsFromRide } from "@/lib/fare";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";

  const now = new Date();
  let startDate: Date;

  if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  const rides = await prisma.ride.findMany({
    where: {
      driverId: session.userId,
      status: "COMPLETED",
      completedAt: { gte: startDate },
    },
    orderBy: { completedAt: "desc" },
    include: {
      rider: { select: { name: true } },
    },
  });

  const totalEarnings = rides.reduce((sum, r) => sum + getDriverEarningsFromRide(r), 0);
  const totalGross = rides.reduce((sum, r) => sum + (r.finalFare ?? r.estimatedFare), 0);
  const totalCommission = Math.round((totalGross - totalEarnings) * 100) / 100;
  const tripCount = rides.length;

  return NextResponse.json({
    period,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    totalCommission,
    commissionPercent: Math.round(COMMISSION_RATE * 100),
    tripCount,
    rides: rides.map((r) => ({
      ...r,
      displayEarnings: getDriverEarningsFromRide(r),
    })),
  });
}
