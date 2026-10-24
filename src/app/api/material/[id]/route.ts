import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const material = await prisma.material.findUnique({
    where: { id },
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

  if (!material?.filePath) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const ub = material.unterthema.themenkomplex.uebergabe;
  const darf = me.role === "ADMIN" || ub.ownerId === me.id || ub.zugriffe.some((z) => z.userId === me.id);
  if (!darf) return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });

  try {
    const buffer = await readFile(material.filePath);
    const safeName = encodeURIComponent(material.fileName ?? "datei");
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": material.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Datei nicht lesbar" }, { status: 404 });
  }
}
