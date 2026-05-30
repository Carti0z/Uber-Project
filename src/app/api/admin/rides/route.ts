import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { RideStatus } from "@prisma/client";

const ACTIVE_STATUSES: RideStatus[] = [
  "REQUESTED",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "IN_PROGRESS",
];

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "active";

  let statusFilter: RideStatus | { in: RideStatus[] } | undefined;
  if (filter === "active") statusFilter = { in: ACTIVE_STATUSES };
  else if (filter === "completed") statusFilter = "COMPLETED";
  else if (filter === "cancelled") statusFilter = "CANCELLED";
  else {
    return NextResponse.json(
      { error: "filter must be active, completed, or cancelled" },
      { status: 400 }
    );
  }

  const rides = await prisma.ride.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
    include: {
      rider: { select: { id: true, name: true, email: true } },
      driver: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ rides });
}
