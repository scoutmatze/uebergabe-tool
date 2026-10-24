import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveMaterial } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const unterthemaId = String(form.get("unterthemaId") ?? "").trim();
    const titel = String(form.get("titel") ?? "").trim();

    if (!(file instanceof Blob) || !unterthemaId) {
      return NextResponse.json({ error: "Datei und Unterthema erforderlich." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Datei zu groß (max. 25 MB)." }, { status: 413 });
    }

    // Berechtigung: Owner oder Admin
    const unterthema = await prisma.unterthema.findUnique({
      where: { id: unterthemaId },
      include: { themenkomplex: { include: { uebergabe: { select: { ownerId: true } } } } },
    });
    if (!unterthema) return NextResponse.json({ error: "Unterthema nicht gefunden." }, { status: 404 });
    const ownerId = unterthema.themenkomplex.uebergabe.ownerId;
    if (me.role !== "ADMIN" && ownerId !== me.id) {
      return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
    }

    const originalName = (file as File).name || "datei";
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = await saveMaterial(buffer, originalName);

    const count = await prisma.material.count({ where: { unterthemaId } });
    await prisma.material.create({
      data: {
        unterthemaId,
        art: "FILE",
        titel: titel || originalName,
        fileName: originalName,
        filePath,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        position: count,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Upload-Fehler:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 500 });
  }
}
