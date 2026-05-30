import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.ride.findMany({
    where: { status: "REQUESTED" },
    orderBy: { createdAt: "desc" },
    include: {
      rider: { select: { id: true, name: true, phone: true } },
    },
  });

  const activeRide = await prisma.ride.findFirst({
    where: {
      driverId: session.userId,
      status: { in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"] },
    },
    include: {
      rider: { select: { id: true, name: true, phone: true } },
    },
  });

  return NextResponse.json({ requests, activeRide });
}
