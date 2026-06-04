import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { splitFare } from "@/lib/fare";
import {
  emitDriverLocation,
  emitRideAccepted,
  emitRideCompleted,
  emitRideStatusChange,
} from "@/lib/socket-emit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ride = await prisma.ride.findUnique({
    where: { id },
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
              currentLat: true,
              currentLng: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
      },
    },
  });

  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  if (ride.riderId !== session.userId && ride.driverId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ride });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, cancelReason, driverLat, driverLng, rating, comment } = body;

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  if (action === "cancel") {
    if (ride.riderId !== session.userId && ride.driverId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (["COMPLETED", "CANCELLED"].includes(ride.status)) {
      return NextResponse.json({ error: "Ride cannot be cancelled" }, { status: 400 });
    }

    const updated = await prisma.ride.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledBy: session.userId,
        cancelReason: cancelReason || "Cancelled by user",
      },
    });
    emitRideStatusChange(updated as unknown as Record<string, unknown>);
    return NextResponse.json({ ride: updated });
  }

  if (action === "accept" && session.role === "DRIVER") {
    if (ride.status !== "REQUESTED") {
      return NextResponse.json({ error: "Ride no longer available" }, { status: 400 });
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!driverProfile?.isOnline) {
      return NextResponse.json({ error: "Go online to accept rides" }, { status: 400 });
    }
    if (!driverProfile.documentsVerified) {
      return NextResponse.json(
        {
          error:
            driverProfile.verificationRemark ||
            "Complete NIN and driver's license verification before accepting rides.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.ride.update({
      where: { id },
      data: {
        driverId: session.userId,
        status: "DRIVER_ASSIGNED",
        driverLat: driverProfile.currentLat,
        driverLng: driverProfile.currentLng,
        etaMinutes: Math.ceil(Math.random() * 5 + 3),
      },
      include: {
        rider: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });
    emitRideAccepted(updated as unknown as Record<string, unknown>);
    return NextResponse.json({ ride: updated });
  }

  if (action === "reject" && session.role === "DRIVER") {
    return NextResponse.json({ success: true });
  }

  if (action === "arriving" && ride.driverId === session.userId) {
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "DRIVER_ARRIVING", etaMinutes: 2 },
    });
    emitRideStatusChange(updated as unknown as Record<string, unknown>);
    return NextResponse.json({ ride: updated });
  }

  if (action === "start" && ride.driverId === session.userId) {
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date(), tripProgress: 10 },
    });
    emitRideStatusChange(updated as unknown as Record<string, unknown>);
    return NextResponse.json({ ride: updated });
  }

  if (action === "complete" && ride.driverId === session.userId) {
    const totalFare = ride.estimatedFare;
    const { platformCommission, driverEarnings, commissionRate } = splitFare(totalFare);
    const updated = await prisma.ride.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        finalFare: totalFare,
        platformCommission,
        driverEarnings,
        commissionRate,
        paymentStatus: ride.paymentMethod === "CASH" ? "COMPLETED" : "PENDING",
        tripProgress: 100,
      },
    });
    emitRideCompleted(updated as unknown as Record<string, unknown>);
    return NextResponse.json({ ride: updated });
  }

  if (action === "update_location" && ride.driverId === session.userId) {
    const progress = Math.min(95, ride.tripProgress + 5);
    const updated = await prisma.ride.update({
      where: { id },
      data: {
        driverLat: driverLat ?? ride.driverLat,
        driverLng: driverLng ?? ride.driverLng,
        tripProgress: ride.status === "IN_PROGRESS" ? progress : ride.tripProgress,
        etaMinutes: ride.status === "DRIVER_ARRIVING" ? Math.max(1, (ride.etaMinutes || 5) - 1) : ride.etaMinutes,
      },
    });

    await prisma.driverProfile.update({
      where: { userId: session.userId },
      data: { currentLat: driverLat, currentLng: driverLng },
    });

    emitDriverLocation(id, {
      driverLat: updated.driverLat,
      driverLng: updated.driverLng,
      etaMinutes: updated.etaMinutes,
      tripProgress: updated.tripProgress,
      riderId: ride.riderId,
    });

    return NextResponse.json({ ride: updated });
  }

  if (action === "pay_cash" && ride.riderId === session.userId && ride.status === "COMPLETED") {
    const updated = await prisma.ride.update({
      where: { id },
      data: { paymentStatus: "COMPLETED" },
    });
    return NextResponse.json({ ride: updated });
  }

  if (action === "rate" && ride.riderId === session.userId && ride.status === "COMPLETED") {
    if (ride.rating) {
      return NextResponse.json({ error: "Already rated" }, { status: 400 });
    }
    const stars = Number(rating);
    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Rating must be 1–5 stars" }, { status: 400 });
    }

    const updated = await prisma.ride.update({
      where: { id },
      data: {
        rating: stars,
        ratingComment: comment || null,
        ratedAt: new Date(),
      },
    });

    if (ride.driverId) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: ride.driverId },
      });
      if (driverProfile) {
        const newCount = driverProfile.ratingCount + 1;
        const newAvg =
          (driverProfile.averageRating * driverProfile.ratingCount + stars) / newCount;
        await prisma.driverProfile.update({
          where: { userId: ride.driverId },
          data: { ratingCount: newCount, averageRating: Math.round(newAvg * 10) / 10 },
        });
      }
    }

    return NextResponse.json({ ride: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
