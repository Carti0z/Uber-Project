import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      suspended: true,
      createdAt: true,
      driverProfile: {
        select: {
          nin: true,
          licenseNumber: true,
          documentsVerified: true,
          ninVerified: true,
          licenseVerified: true,
          verificationStatus: true,
          verificationRemark: true,
          verificationCheckedAt: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          ridesAsDriver: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ drivers });
}
