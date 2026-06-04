import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyDriverDocumentsWithPrembly } from "@/lib/prembly";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.driverProfile.findUnique({
    where: { userId: session.userId },
    select: {
      nin: true,
      licenseNumber: true,
      documentsVerified: true,
      ninVerified: true,
      licenseVerified: true,
      verificationStatus: true,
      verificationRemark: true,
      verificationCheckedAt: true,
    },
  });

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const nin = String(body?.nin || "").trim();
    const licenseNumber = String(body?.licenseNumber || "").trim();

    const existing = await prisma.driverProfile.findUnique({
      where: { userId: session.userId },
      select: { nin: true, licenseNumber: true },
    });

    const resolvedNin = nin || existing?.nin || "";
    const resolvedLicense = licenseNumber || existing?.licenseNumber || "";

    if (!resolvedNin || !resolvedLicense) {
      return NextResponse.json(
        { error: "NIN and driver's license are required for verification." },
        { status: 400 }
      );
    }

    const result = await verifyDriverDocumentsWithPrembly({
      nin: resolvedNin,
      licenseNumber: resolvedLicense,
    });

    const profile = await prisma.driverProfile.update({
      where: { userId: session.userId },
      data: {
        nin: resolvedNin,
        licenseNumber: resolvedLicense,
        ninVerified: result.ninVerified,
        licenseVerified: result.licenseVerified,
        documentsVerified: result.documentsVerified,
        verificationStatus: result.verificationStatus,
        verificationRemark: result.verificationRemark,
        verificationCheckedAt: new Date(),
      },
      select: {
        nin: true,
        licenseNumber: true,
        documentsVerified: true,
        ninVerified: true,
        licenseVerified: true,
        verificationStatus: true,
        verificationRemark: true,
        verificationCheckedAt: true,
      },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
