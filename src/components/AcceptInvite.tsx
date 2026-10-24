"use client";

import { useState } from "react";

export default function AcceptInvite({ token }: { token: string }) {
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (pin.length < 4) return setError("PIN muss mindestens 4 Zeichen haben.");
    if (pin !== pin2) return setError("Die PINs stimmen nicht überein.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler.");
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-left">
      <div>
        <label className="block text-sm font-bold text-dpsg-blue mb-1">PIN wählen</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-dpsg-blue mb-1">PIN wiederholen</label>
        <input
          type="password"
          value={pin2}
          onChange={(e) => setPin2(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
        />
      </div>
      {error && <p className="text-dpsg-red text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-lg bg-dpsg-blue px-5 py-3 text-white font-bold hover:opacity-90 transition disabled:opacity-50"
      >
        {busy ? "…" : "PIN speichern & loslegen"}
      </button>
    </div>
  );
}
