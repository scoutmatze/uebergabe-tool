import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const AUDIO_DIR = process.env.AUDIO_DIR ?? "/data/audio";
const MATERIAL_DIR = process.env.MATERIAL_DIR ?? "/data/material";

// Speichert ein Audio-Blob auf der Platte und gibt den Pfad zurück.
export async function saveAudio(buffer: Buffer, ext = "webm"): Promise<string> {
  await mkdir(AUDIO_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const path = join(AUDIO_DIR, filename);
  await writeFile(path, buffer);
  return path;
}

// Speichert eine hochgeladene Datei; Endung aus Originalname übernehmen.
export async function saveMaterial(buffer: Buffer, originalName: string): Promise<string> {
  await mkdir(MATERIAL_DIR, { recursive: true });
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot) : "";
  const path = join(MATERIAL_DIR, `${randomUUID()}${ext}`);
  await writeFile(path, buffer);
  return path;
}
