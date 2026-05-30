import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      driverProfile: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: { name?: string; phone?: string; passwordHash?: string } = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone;

    if (newPassword) {
      const { verifyPassword } = await import("@/lib/auth");
      if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
      }
      data.passwordHash = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
