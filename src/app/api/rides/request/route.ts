import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateRide } from "@/lib/fare";
import { emitRideRequested } from "@/lib/socket-emit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "RIDER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      paymentMethod,
    } = body;

    const activeRide = await prisma.ride.findFirst({
      where: {
        riderId: session.userId,
        status: { in: ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"] },
      },
    });

    if (activeRide) {
      return NextResponse.json({ error: "You already have an active ride" }, { status: 400 });
    }

    const { distanceKm, durationMin, estimatedFare } = estimateRide(
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng
    );

    const ride = await prisma.ride.create({
      data: {
        riderId: session.userId,
        pickupAddress,
        pickupLat,
        pickupLng,
        destinationAddress,
        destinationLat,
        destinationLng,
        distanceKm,
        durationMin,
        estimatedFare,
        paymentMethod: paymentMethod === "CARD" ? "CARD" : "CASH",
      },
      include: {
        rider: { select: { id: true, name: true } },
      },
    });

    emitRideRequested(ride as unknown as Record<string, unknown>);

    return NextResponse.json({ ride });
  } catch {
    return NextResponse.json({ error: "Failed to request ride" }, { status: 500 });
  }
}
