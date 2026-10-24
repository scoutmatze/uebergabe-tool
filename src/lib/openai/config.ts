// OpenAI API Konfiguration.
// Transkription: lokal (faster-whisper), via Python-Script
// Stichpunkte & (später) Embeddings: OpenAI API
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Fehlende Env-Variable: ${name}`);
  return value;
}

export const openaiConfig = {
  apiKey: () => required("OPENAI_API_KEY"),
};

export const MODELS = {
  chat: "gpt-4o-mini", // Stichpunkt-Generierung (alternativ: gpt-3.5-turbo, gpt-4-turbo)
  embed: "text-embedding-3-small", // Später für semantische Suche
};
