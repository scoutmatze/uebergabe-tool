"use client";

import { useState } from "react";

export default function ChangePin() {
  const [open, setOpen] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler.");
      setMsg("PIN geändert ✓");
      setOldPin("");
      setNewPin("");
      setTimeout(() => setOpen(false), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-neutral-500 hover:text-dpsg-blue">
        PIN ändern
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3 bg-white flex flex-wrap items-center gap-2">
      <input
        type="password"
        value={oldPin}
        onChange={(e) => setOldPin(e.target.value)}
        placeholder="Aktueller PIN"
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      />
      <input
        type="password"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        placeholder="Neuer PIN"
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      />
      <button onClick={submit} disabled={busy} className="rounded bg-dpsg-blue px-3 py-1 text-white text-sm font-bold disabled:opacity-50">
        {busy ? "…" : "Speichern"}
      </button>
      <button onClick={() => setOpen(false)} className="text-sm text-neutral-400">Abbrechen</button>
      {msg && <span className="text-sm text-dpsg-blue w-full">{msg}</span>}
    </div>
  );
}
