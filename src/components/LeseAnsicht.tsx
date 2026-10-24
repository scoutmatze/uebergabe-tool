"use client";

import { useMemo, useState } from "react";

type Material = { id: string; art: "FILE" | "LINK"; titel: string; url: string | null };
type Eintrag = { id: string; transcript: string | null; stichpunkte: { id: string; text: string }[] };
type Unterthema = { id: string; titel: string; eintraege: Eintrag[]; materialien: Material[] };
type Themenkomplex = { id: string; titel: string; unterthemen: Unterthema[] };

export default function LeseAnsicht({
  titel,
  themenkomplexe,
}: {
  titel: string;
  themenkomplexe: Themenkomplex[];
}) {
  const [q, setQ] = useState("");

  const gefiltert = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return themenkomplexe;

    const utMatch = (ut: Unterthema) =>
      ut.titel.toLowerCase().includes(needle) ||
      ut.materialien.some((m) => m.titel.toLowerCase().includes(needle)) ||
      ut.eintraege.some(
        (e) =>
          (e.transcript ?? "").toLowerCase().includes(needle) ||
          e.stichpunkte.some((s) => s.text.toLowerCase().includes(needle))
      );

    return themenkomplexe
      .map((tk) => {
        const tkMatch = tk.titel.toLowerCase().includes(needle);
        const unterthemen = tkMatch ? tk.unterthemen : tk.unterthemen.filter(utMatch);
        return { ...tk, unterthemen, _show: tkMatch || unterthemen.length > 0 };
      })
      .filter((tk) => tk._show);
  }, [q, themenkomplexe]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <p className="text-dpsg-red font-bold tracking-widest uppercase text-sm">DPSG Übergabe</p>
          <h1 className="text-3xl font-bold text-dpsg-blue mt-1">{titel}</h1>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-neutral-500 hover:text-dpsg-red whitespace-nowrap">Abmelden</button>
        </form>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
        <span className="font-bold">📁 Archiv.</span> Diese Übergabe ist abgeschlossen – Inhalte können
        nur noch gelesen und durchsucht werden. Neue Themen oder Aufnahmen lassen sich nicht mehr hinzufügen.
      </div>

      <div className="sticky top-0 bg-white/90 backdrop-blur py-3 -mx-6 px-6 mb-6 border-b border-neutral-100 z-10">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Durchsuchen – Stichworte, Namen, Transkripte …"
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
        />
        {q.trim() && (
          <p className="text-xs text-neutral-500 mt-1">
            {gefiltert.length === 0 ? "Keine Treffer" : `${gefiltert.length} Themenkomplex(e) mit Treffern`}
          </p>
        )}
      </div>

      {themenkomplexe.length === 0 && (
        <p className="text-neutral-500">Diese Übergabe enthält keine Inhalte.</p>
      )}

      <div className="space-y-10">
        {gefiltert.map((tk) => (
          <section key={tk.id}>
            <h2 className="text-xl font-bold text-dpsg-blue border-l-4 border-dpsg-blue pl-3">{tk.titel}</h2>
            <div className="mt-4 space-y-6 pl-3">
              {tk.unterthemen.map((ut) => (
                <div key={ut.id}>
                  <h3 className="font-bold text-neutral-800">{ut.titel}</h3>

                  {ut.eintraege.map((e) => (
                    <div key={e.id} className="mt-2 space-y-2">
                      {e.stichpunkte.length > 0 && (
                        <ul className="space-y-1">
                          {e.stichpunkte.map((sp) => (
                            <li key={sp.id} className="flex gap-2">
                              <span className="text-dpsg-blue">•</span>
                              <span>{sp.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <audio controls preload="none" src={`/api/audio/${e.id}`} className="w-full h-9" />
                      {e.transcript && (
                        <details className="text-sm text-neutral-600">
                          <summary className="cursor-pointer font-bold text-dpsg-blue">Transkript</summary>
                          <p className="mt-2 whitespace-pre-wrap">{e.transcript}</p>
                        </details>
                      )}
                    </div>
                  ))}

                  {ut.materialien.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {ut.materialien.map((m) => (
                        <li key={m.id} className="flex gap-2 text-sm">
                          <span>{m.art === "FILE" ? "📄" : "🔗"}</span>
                          {m.art === "FILE" ? (
                            <a href={`/api/material/${m.id}`} className="text-dpsg-blue hover:underline">
                              {m.titel}
                            </a>
                          ) : (
                            <a href={m.url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-dpsg-blue hover:underline">
                              {m.titel}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
