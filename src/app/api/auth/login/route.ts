import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, createToken } from "@/lib/auth";

export const runtime = "nodejs"; // bcrypt braucht Node-Runtime

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json();
    if (!email || !pin) {
      return NextResponse.json({ error: "E-Mail und PIN erforderlich." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user?.passwordHash || !(await verifyPin(String(pin), user.passwordHash))) {
      return NextResponse.json({ error: "E-Mail oder PIN falsch." }, { status: 401 });
    }

    const token = await createToken(user.id, user.email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}
