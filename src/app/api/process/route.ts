import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveAudio } from "@/lib/storage";
import { transcribeAudio } from "@/lib/openai/transcribe";
import { summarizeToBullets } from "@/lib/openai/summarize";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300; // lokales Whisper (medium) kann dauern

export async function POST(req: NextRequest) {
  const [, errorResponse] = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const unterthemaId = String(form.get("unterthemaId") ?? "").trim();
    const replaceEintragId = String(form.get("replaceEintragId") ?? "").trim();

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Keine Audio-Datei erhalten." }, { status: 400 });
    }
    if (!unterthemaId) {
      return NextResponse.json({ error: "Unterthema fehlt." }, { status: 400 });
    }

    // Kontext laden (Themenkomplex, Unterthema, Begriffe der Übergabe)
    const unterthema = await prisma.unterthema.findUnique({
      where: { id: unterthemaId },
      include: { themenkomplex: { include: { uebergabe: true } } },
    });
    if (!unterthema) {
      return NextResponse.json({ error: "Unterthema nicht gefunden." }, { status: 404 });
    }
    const themenkomplexTitel = unterthema.themenkomplex.titel;
    const unterthemaTitel = unterthema.titel;
    const begriffe = unterthema.themenkomplex.uebergabe.begriffe;

    // "Neu aufnehmen": alten Eintrag entfernen
    if (replaceEintragId) {
      await prisma.eintrag.delete({ where: { id: replaceEintragId } }).catch(() => {});
    }

    // Audio speichern + Eintrag anlegen
    const buffer = Buffer.from(await audio.arrayBuffer());
    const audioPath = await saveAudio(buffer);
    const eintrag = await prisma.eintrag.create({
      data: { unterthemaId, audioPath, audioMimeType: audio.type || "audio/webm", status: "RECORDED" },
    });

    // Transkription (Whisper medium) mit Kontext + Begriffen
    let contextPrompt = `DPSG-Amtsuebergabe. Themenkomplex: ${themenkomplexTitel}. Unterthema: ${unterthemaTitel}.`;
    if (begriffe) contextPrompt += ` Namen und Begriffe: ${begriffe}.`;

    await prisma.eintrag.update({ where: { id: eintrag.id }, data: { status: "TRANSCRIBING" } });
    const transcript = await transcribeAudio(audioPath, contextPrompt);
    await prisma.eintrag.update({ where: { id: eintrag.id }, data: { transcript, status: "TRANSCRIBED" } });

    // Stichpunkte (OpenAI)
    const bullets = await summarizeToBullets(transcript, {
      themenkomplex: themenkomplexTitel,
      unterthema: unterthemaTitel,
    });
    await prisma.stichpunkt.createMany({
      data: bullets.map((text, i) => ({ eintragId: eintrag.id, text, position: i })),
    });
    await prisma.eintrag.update({ where: { id: eintrag.id }, data: { status: "SUMMARIZED" } });

    return NextResponse.json({ ok: true, eintragId: eintrag.id });
  } catch (err) {
    console.error("Pipeline-Fehler:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
