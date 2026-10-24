import { OpenAI } from "openai";
import { openaiConfig, MODELS } from "./config";

const SYSTEM_PROMPT = `Du hilfst bei einer Amtsübergabe in einem ehrenamtlichen Jugendverband (DPSG).
Aus einem gesprochenen Transkript (Sprachnachricht) erzeugst du knappe, sachliche Stichpunkte zum Nachschlagen.
Regeln:
- Bleibe inhaltlich exakt beim Transkript, erfinde nichts hinzu.
- Ein Gedanke pro Stichpunkt, je 1 kurzer Satz oder Halbsatz.
- Reihenfolge wie im Original, Füllwörter und Wiederholungen weglassen.
- Namen, Fristen, Zugänge, Ansprechpartner:innen unbedingt erhalten.
- Antworte AUSSCHLIESSLICH als JSON-Array von Strings, ohne Markdown, ohne Vor-/Nachtext.`;

export async function summarizeToBullets(
  transcript: string,
  context?: { themenkomplex?: string; unterthema?: string }
): Promise<string[]> {
  const client = new OpenAI({ apiKey: openaiConfig.apiKey() });

  const kontext = context
    ? `Themenkomplex: ${context.themenkomplex ?? "-"} / Unterthema: ${context.unterthema ?? "-"}\n\n`
    : "";

  const response = await client.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${kontext}Transkript:\n${transcript}` },
    ],
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  return parseBullets(raw);
}

// Modell kann je nach Prompt {"stichpunkte": [...]} oder direkt [...] liefern -> robust parsen.
function parseBullets(raw: string): string[] {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String);
    const arr = parsed.stichpunkte ?? parsed.bullets ?? parsed.items;
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    // Fallback: zeilenweise zerlegen
    return cleaned
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean);
  }
  return [];
}
