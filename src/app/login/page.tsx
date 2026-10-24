"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Anmeldung fehlgeschlagen.");
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-dpsg-red font-bold tracking-widest uppercase text-sm">DPSG</p>
          <h1 className="text-3xl font-bold text-dpsg-blue mt-1">Übergabe</h1>
          <p className="text-neutral-600 mt-2">Bitte anmelden</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-dpsg-blue mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-dpsg-blue mb-1">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
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
            {busy ? "Anmelden …" : "Anmelden"}
          </button>
        </div>
      </div>
    </main>
  );
}
