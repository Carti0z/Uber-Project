import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateRide } from "@/lib/fare";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "RIDER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pickupLat, pickupLng, destinationLat, destinationLng } = body;

    if (
      pickupLat == null ||
      pickupLng == null ||
      destinationLat == null ||
      destinationLng == null
    ) {
      return NextResponse.json({ error: "All coordinates required" }, { status: 400 });
    }

    const estimate = estimateRide(pickupLat, pickupLng, destinationLat, destinationLng);
    return NextResponse.json(estimate);
  } catch {
    return NextResponse.json({ error: "Estimation failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const role = session.role;

  const where =
    role === "RIDER"
      ? { riderId: session.userId, ...(status && { status: status as never }) }
      : { driverId: session.userId, ...(status && { status: status as never }) };

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      rider: { select: { id: true, name: true, phone: true } },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          driverProfile: {
            select: {
              vehicleMake: true,
              vehicleModel: true,
              vehiclePlate: true,
              vehicleColor: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ rides });
}
