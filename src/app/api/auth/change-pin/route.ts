import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, verifyPin, hashPin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const [auth, errorResponse] = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { oldPin, newPin } = await req.json();
    if (!newPin || String(newPin).length < 4) {
      return NextResponse.json({ error: "Neuer PIN muss mindestens 4 Zeichen haben." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user?.passwordHash || !(await verifyPin(String(oldPin), user.passwordHash))) {
      return NextResponse.json({ error: "Aktueller PIN falsch." }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPin(String(newPin)) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Ändern." }, { status: 500 });
  }
}
