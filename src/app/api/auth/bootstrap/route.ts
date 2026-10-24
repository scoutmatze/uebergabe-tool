import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/auth";

export const runtime = "nodejs";

// Einmaliger Admin-Bootstrap. Funktioniert nur, solange noch KEIN User existiert.
export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: "Bereits initialisiert." }, { status: 409 });
  }

  const email = process.env.ADMIN_EMAIL;
  const pin = process.env.ADMIN_PIN;
  if (!email || !pin) {
    return NextResponse.json({ error: "ADMIN_EMAIL/ADMIN_PIN nicht gesetzt." }, { status: 500 });
  }

  const passwordHash = await hashPin(pin);
  await prisma.user.create({
    data: { email: email.toLowerCase(), name: "Admin", role: "ADMIN", passwordHash },
  });
  return NextResponse.json({ ok: true, email });
}
