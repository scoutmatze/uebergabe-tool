"use server";

import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { summarizeToBullets } from "@/lib/openai/summarize";

async function requireUser() {
  const user = await verifyToken();
  if (!user) throw new Error("Nicht angemeldet");
  return user;
}

// ---------- Übergabe ----------
export async function createUebergabe(titel: string) {
  const user = await requireUser();
  const ub = await prisma.uebergabe.create({
    data: { titel: titel.trim() || "Neue Übergabe", ownerId: user.userId },
  });
  return ub.id;
}

export async function updateUebergabe(id: string, data: { titel?: string; begriffe?: string }) {
  await requireUser();
  await prisma.uebergabe.update({ where: { id }, data });
}

export async function deleteUebergabe(id: string) {
  await requireUser();
  await prisma.uebergabe.delete({ where: { id } });
}

// ---------- Themenkomplex ----------
export async function createThemenkomplex(uebergabeId: string, titel: string) {
  await requireUser();
  const count = await prisma.themenkomplex.count({ where: { uebergabeId } });
  await prisma.themenkomplex.create({
    data: { uebergabeId, titel: titel.trim() || "Neuer Themenkomplex", position: count },
  });
}

export async function updateThemenkomplex(id: string, titel: string) {
  await requireUser();
  await prisma.themenkomplex.update({ where: { id }, data: { titel: titel.trim() } });
}

export async function deleteThemenkomplex(id: string) {
  await requireUser();
  await prisma.themenkomplex.delete({ where: { id } });
}

// ---------- Unterthema ----------
export async function createUnterthema(themenkomplexId: string, titel: string) {
  await requireUser();
  const count = await prisma.unterthema.count({ where: { themenkomplexId } });
  await prisma.unterthema.create({
    data: { themenkomplexId, titel: titel.trim() || "Neues Unterthema", position: count },
  });
}

export async function updateUnterthema(id: string, titel: string) {
  await requireUser();
  await prisma.unterthema.update({ where: { id }, data: { titel: titel.trim() } });
}

export async function deleteUnterthema(id: string) {
  await requireUser();
  await prisma.unterthema.delete({ where: { id } });
}

// ---------- Eintrag ----------
export async function deleteEintrag(id: string) {
  await requireUser();
  await prisma.eintrag.delete({ where: { id } });
}

export async function updateTranscript(id: string, transcript: string) {
  await requireUser();
  await prisma.eintrag.update({ where: { id }, data: { transcript } });
}

// Stichpunkte aus dem (ggf. korrigierten) Transkript neu generieren.
export async function regenerateStichpunkte(eintragId: string) {
  await requireUser();
  const eintrag = await prisma.eintrag.findUnique({
    where: { id: eintragId },
    include: { unterthema: { include: { themenkomplex: true } } },
  });
  if (!eintrag?.transcript) throw new Error("Kein Transkript vorhanden.");

  const bullets = await summarizeToBullets(eintrag.transcript, {
    themenkomplex: eintrag.unterthema.themenkomplex.titel,
    unterthema: eintrag.unterthema.titel,
  });

  await prisma.stichpunkt.deleteMany({ where: { eintragId } });
  await prisma.stichpunkt.createMany({
    data: bullets.map((text, i) => ({ eintragId, text, position: i })),
  });
}

// ---------- Stichpunkt ----------
export async function updateStichpunkt(id: string, text: string) {
  await requireUser();
  await prisma.stichpunkt.update({ where: { id }, data: { text: text.trim() } });
}

export async function deleteStichpunkt(id: string) {
  await requireUser();
  await prisma.stichpunkt.delete({ where: { id } });
}

export async function addStichpunkt(eintragId: string, text: string) {
  await requireUser();
  const count = await prisma.stichpunkt.count({ where: { eintragId } });
  await prisma.stichpunkt.create({ data: { eintragId, text: text.trim(), position: count } });
}

// ---------- Material (Links; Datei-Upload läuft über /api/material/upload) ----------
export async function addLink(unterthemaId: string, titel: string, url: string) {
  await requireUser();
  let ziel = url.trim();
  if (ziel && !/^https?:\/\//i.test(ziel)) ziel = `https://${ziel}`;
  if (!ziel) throw new Error("URL erforderlich.");
  const count = await prisma.material.count({ where: { unterthemaId } });
  await prisma.material.create({
    data: { unterthemaId, art: "LINK", titel: titel.trim() || ziel, url: ziel, position: count },
  });
}

export async function deleteMaterial(id: string) {
  await requireUser();
  await prisma.material.delete({ where: { id } });
}
