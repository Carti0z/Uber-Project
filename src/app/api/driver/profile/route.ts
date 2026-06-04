import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.driverProfile.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      isOnline,
      nin,
      licenseNumber,
      licenseDocUrl,
      vehicleMake,
      vehicleModel,
      vehiclePlate,
      vehicleColor,
      vehicleDocUrl,
      currentLat,
      currentLng,
    } = body;

    const hasDocIdentityUpdate =
      nin !== undefined || licenseNumber !== undefined || licenseDocUrl !== undefined;

    const profile = await prisma.driverProfile.update({
      where: { userId: session.userId },
      data: {
        ...(isOnline !== undefined && { isOnline }),
        ...(nin !== undefined && { nin }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(licenseDocUrl !== undefined && { licenseDocUrl }),
        ...(vehicleMake !== undefined && { vehicleMake }),
        ...(vehicleModel !== undefined && { vehicleModel }),
        ...(vehiclePlate !== undefined && { vehiclePlate }),
        ...(vehicleColor !== undefined && { vehicleColor }),
        ...(vehicleDocUrl !== undefined && { vehicleDocUrl }),
        ...(currentLat !== undefined && { currentLat }),
        ...(currentLng !== undefined && { currentLng }),
        ...(hasDocIdentityUpdate && {
          ninVerified: false,
          licenseVerified: false,
          documentsVerified: false,
          verificationStatus: "PENDING",
          verificationRemark:
            "Verification pending. Submit documents for validation before accepting rides.",
          verificationCheckedAt: null,
        }),
      },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
