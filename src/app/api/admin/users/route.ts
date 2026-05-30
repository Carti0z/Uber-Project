import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as UserRole | null;

  if (!role || !["RIDER", "DRIVER"].includes(role)) {
    return NextResponse.json({ error: "role must be RIDER or DRIVER" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      suspended: true,
      createdAt: true,
      driverProfile: role === "DRIVER" ? {
        select: {
          isOnline: true,
          vehicleMake: true,
          vehicleModel: true,
          vehiclePlate: true,
          vehicleColor: true,
          documentsVerified: true,
        },
      } : false,
      _count: {
        select: {
          ridesAsRider: role === "RIDER",
          ridesAsDriver: role === "DRIVER",
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
