import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, createToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token, pin } = await req.json();
    if (!token || !pin || String(pin).length < 4) {
      return NextResponse.json({ error: "PIN muss mindestens 4 Zeichen haben." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { inviteToken: String(token) } });
    if (!user || (user.inviteExpires && user.inviteExpires < new Date())) {
      return NextResponse.json({ error: "Einladung ungültig oder abgelaufen." }, { status: 400 });
    }

    const passwordHash = await hashPin(String(pin));
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, inviteToken: null, inviteExpires: null },
    });

    const jwt = await createToken(user.id, user.email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktivieren." }, { status: 500 });
  }
}
