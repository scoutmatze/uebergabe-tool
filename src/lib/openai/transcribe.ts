import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Transkribiert via lokales faster-whisper. contextPrompt hilft bei Fachbegriffen/Namen.
export async function transcribeAudio(audioPath: string, contextPrompt?: string): Promise<string> {
  if (!existsSync(audioPath)) {
    throw new Error(`Audio-Datei nicht gefunden: ${audioPath}`);
  }

  const args = ["scripts/transcribe.py", audioPath];
  if (contextPrompt) args.push(contextPrompt);

  const result = spawnSync("python3", args, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`Transkription fehlgeschlagen: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Whisper-Fehler: ${result.stderr || "Unbekannter Fehler"}`);
  }
  return result.stdout.trim();
}
