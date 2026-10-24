"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addLink, deleteMaterial } from "@/app/actions";

type Material = {
  id: string;
  art: "FILE" | "LINK";
  titel: string;
  url: string | null;
  fileName: string | null;
};

export default function MaterialPanel({
  unterthemaId,
  materialien,
}: {
  unterthemaId: string;
  materialien: Material[];
}) {
  const [linkTitel, setLinkTitel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("unterthemaId", unterthemaId);
      const res = await fetch("/api/material/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload fehlgeschlagen.");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  async function linkHinzufuegen() {
    if (!linkUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addLink(unterthemaId, linkTitel, linkUrl);
      setLinkTitel("");
      setLinkUrl("");
      setShowLink(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  async function entfernen(id: string) {
    if (!confirm("Dieses Material entfernen?")) return;
    await deleteMaterial(id);
    router.refresh();
  }

  return (
    <div className="mt-3 pt-3 border-t border-neutral-200">
      {materialien.length > 0 && (
        <ul className="space-y-1 mb-2">
          {materialien.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm group">
              <span>{m.art === "FILE" ? "📄" : "🔗"}</span>
              {m.art === "FILE" ? (
                <a href={`/api/material/${m.id}`} className="text-dpsg-blue hover:underline flex-1">
                  {m.titel}
                </a>
              ) : (
                <a href={m.url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-dpsg-blue hover:underline flex-1">
                  {m.titel}
                </a>
              )}
              <button
                onClick={() => entfernen(m.id)}
                className="text-xs text-neutral-400 hover:text-dpsg-red opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-dpsg-blue hover:underline disabled:opacity-50"
        >
          {busy ? "…" : "+ Datei hochladen"}
        </button>
        <span className="text-neutral-300">|</span>
        <button onClick={() => setShowLink((s) => !s)} className="text-dpsg-blue hover:underline">
          + Link
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {showLink && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <input
            value={linkTitel}
            onChange={(e) => setLinkTitel(e.target.value)}
            placeholder="Bezeichnung (optional)"
            className="rounded border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && linkHinzufuegen()}
            placeholder="https://…"
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
          <button onClick={linkHinzufuegen} disabled={busy} className="rounded bg-dpsg-blue px-3 py-1 text-white text-sm font-bold disabled:opacity-50">
            Hinzufügen
          </button>
        </div>
      )}

      {error && <p className="text-dpsg-red text-sm mt-1">{error}</p>}
      <p className="text-xs text-neutral-400 mt-1">Max. 25 MB pro Datei.</p>
    </div>
  );
}
