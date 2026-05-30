import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { suspended } = await request.json();

  if (typeof suspended !== "boolean") {
    return NextResponse.json({ error: "suspended must be a boolean" }, { status: 400 });
  }

  if (id === session!.userId) {
    return NextResponse.json({ error: "Cannot suspend your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot modify admin accounts" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { suspended },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      suspended: true,
    },
  });

  if (suspended && user.role === "DRIVER") {
    await prisma.driverProfile.updateMany({
      where: { userId: id },
      data: { isOnline: false },
    });
  }

  return NextResponse.json({ user: updated });
}
