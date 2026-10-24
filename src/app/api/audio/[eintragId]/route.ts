import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ eintragId: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { eintragId } = await params;
  const eintrag = await prisma.eintrag.findUnique({
    where: { id: eintragId },
    include: {
      unterthema: {
        include: {
          themenkomplex: {
            include: { uebergabe: { include: { zugriffe: { select: { userId: true } } } } },
          },
        },
      },
    },
  });

  if (!eintrag?.audioPath) {
    return NextResponse.json({ error: "Audio nicht gefunden" }, { status: 404 });
  }

  const ub = eintrag.unterthema.themenkomplex.uebergabe;
  const darf = me.role === "ADMIN" || ub.ownerId === me.id || ub.zugriffe.some((z) => z.userId === me.id);
  if (!darf) return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });

  try {
    const buffer = await readFile(eintrag.audioPath);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": eintrag.audioMimeType ?? "audio/webm",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audiodatei nicht lesbar" }, { status: 404 });
  }
}
