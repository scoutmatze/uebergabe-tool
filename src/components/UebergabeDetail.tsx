"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Recorder from "./Recorder";
import MaterialPanel from "./MaterialPanel";
import { InlineEdit, DeleteButton, AddInput } from "./ui";
import {
  updateUebergabe,
  createThemenkomplex,
  updateThemenkomplex,
  deleteThemenkomplex,
  createUnterthema,
  updateUnterthema,
  deleteUnterthema,
  deleteEintrag,
  updateTranscript,
  regenerateStichpunkte,
  updateStichpunkt,
  deleteStichpunkt,
  addStichpunkt,
} from "@/app/actions";

type Stichpunkt = { id: string; text: string };
type Eintrag = { id: string; transcript: string | null; status: string; stichpunkte: Stichpunkt[] };
type Material = { id: string; art: "FILE" | "LINK"; titel: string; url: string | null; fileName: string | null };
type Unterthema = { id: string; titel: string; eintraege: Eintrag[]; materialien: Material[] };
type Themenkomplex = { id: string; titel: string; unterthemen: Unterthema[] };
type Uebergabe = {
  id: string;
  titel: string;
  begriffe: string | null;
  themenkomplexe: Themenkomplex[];
};

function RegenerateButton({ eintragId }: { eintragId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await regenerateStichpunkte(eintragId);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="text-xs text-dpsg-blue hover:underline disabled:opacity-50"
    >
      {busy ? "Generiere neu …" : "Stichpunkte neu generieren"}
    </button>
  );
}

function EintragView({ eintrag, unterthemaId }: { eintrag: Eintrag; unterthemaId: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
      <ul className="space-y-1">
        {eintrag.stichpunkte.map((sp) => (
          <li key={sp.id} className="flex items-start gap-2 group">
            <span className="text-dpsg-blue mt-1">•</span>
            <InlineEdit value={sp.text} onSave={(v) => updateStichpunkt(sp.id, v)} className="flex-1" />
            <span className="opacity-0 group-hover:opacity-100 transition">
              <DeleteButton onDelete={() => deleteStichpunkt(sp.id)} label="×" confirmText="Stichpunkt löschen?" />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <AddInput onAdd={(t) => addStichpunkt(eintrag.id, t)} placeholder="Stichpunkt ergänzen …" />
      </div>

      <audio controls preload="none" src={`/api/audio/${eintrag.id}`} className="w-full h-9 mt-3" />

      <details className="mt-3 text-sm text-neutral-600">
        <summary className="cursor-pointer font-bold">Transkript (zum Korrigieren)</summary>
        <div className="mt-2">
          <InlineEdit
            value={eintrag.transcript ?? ""}
            onSave={(v) => updateTranscript(eintrag.id, v)}
            multiline
            placeholder="(kein Transkript)"
            className="block w-full whitespace-pre-wrap"
          />
          <div className="mt-2">
            <RegenerateButton eintragId={eintrag.id} />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-200">
        <span className="text-xs text-neutral-500">Neu aufnehmen ersetzt diesen Eintrag:</span>
        <Recorder unterthemaId={unterthemaId} replaceEintragId={eintrag.id} label="Neu aufnehmen" />
        <DeleteButton onDelete={() => deleteEintrag(eintrag.id)} label="Eintrag löschen" confirmText="Diesen Eintrag löschen?" />
      </div>
    </div>
  );
}

export default function UebergabeDetail({ uebergabe }: { uebergabe: Uebergabe }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-dpsg-blue">
          <InlineEdit value={uebergabe.titel} onSave={(v) => updateUebergabe(uebergabe.id, { titel: v })} />
        </h1>
        <div className="mt-3 text-sm">
          <span className="font-bold text-dpsg-blue">Namen & Begriffe </span>
          <span className="text-neutral-500">(helfen Whisper, Eigennamen korrekt zu erkennen):</span>
          <div className="mt-1">
            <InlineEdit
              value={uebergabe.begriffe ?? ""}
              onSave={(v) => updateUebergabe(uebergabe.id, { begriffe: v })}
              placeholder="z.B. Annka, Diözesanverband München und Freising, Bundesamt"
              className="block w-full"
            />
          </div>
        </div>
      </header>

      {uebergabe.themenkomplexe.map((tk) => (
        <section key={tk.id} className="border-l-4 border-dpsg-blue pl-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-dpsg-blue">
              <InlineEdit value={tk.titel} onSave={(v) => updateThemenkomplex(tk.id, v)} />
            </h2>
            <DeleteButton onDelete={() => deleteThemenkomplex(tk.id)} confirmText={`Themenkomplex "${tk.titel}" mit allen Inhalten löschen?`} />
          </div>

          <div className="mt-3 space-y-5 pl-2">
            {tk.unterthemen.map((ut) => (
              <div key={ut.id}>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-neutral-800">
                    <InlineEdit value={ut.titel} onSave={(v) => updateUnterthema(ut.id, v)} />
                  </h3>
                  <DeleteButton onDelete={() => deleteUnterthema(ut.id)} confirmText={`Unterthema "${ut.titel}" löschen?`} />
                </div>

                <div className="mt-2 space-y-3">
                  {ut.eintraege.map((e) => (
                    <EintragView key={e.id} eintrag={e} unterthemaId={ut.id} />
                  ))}
                  {ut.eintraege.length === 0 && (
                    <Recorder unterthemaId={ut.id} label="Sprachnachricht aufnehmen" />
                  )}
                </div>
                <MaterialPanel unterthemaId={ut.id} materialien={ut.materialien} />
              </div>
            ))}

            <div className="pt-2">
              <AddInput onAdd={(t) => createUnterthema(tk.id, t)} placeholder="Neues Unterthema …" buttonLabel="+ Unterthema" />
            </div>
          </div>
        </section>
      ))}

      <div className="pt-4 border-t border-neutral-200">
        <AddInput onAdd={(t) => createThemenkomplex(uebergabe.id, t)} placeholder="Neuer Themenkomplex …" buttonLabel="+ Themenkomplex" />
      </div>
    </div>
  );
}
