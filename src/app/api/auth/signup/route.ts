import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const userRole: UserRole = role === "DRIVER" ? "DRIVER" : "RIDER";
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: userRole,
        ...(userRole === "DRIVER" && {
          driverProfile: { create: {} },
        }),
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
