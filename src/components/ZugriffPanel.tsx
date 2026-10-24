"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantAccess, revokeAccess } from "@/app/admin-actions";

type ZugriffItem = { id: string; email: string; name: string; aktiviert: boolean };

export default function ZugriffPanel({
  uebergabeId,
  zugriffe,
}: {
  uebergabeId: string;
  zugriffe: ZugriffItem[];
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function hinzufuegen() {
    setBusy(true);
    setError(null);
    setInviteLink(null);
    try {
      const { inviteLink, status } = await grantAccess(uebergabeId, email, name);
      if (status === "invited" && inviteLink) setInviteLink(inviteLink);
      setEmail("");
      setName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  async function entziehen(id: string) {
    await revokeAccess(id);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
      <h2 className="font-bold text-dpsg-blue mb-1">Lesezugriff</h2>
      <p className="text-sm text-neutral-500 mb-3">
        Personen einladen, die diese Übergabe lesen dürfen. Neue Personen bekommen einen Einladungslink.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dpsg-blue"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dpsg-blue"
        />
        <button
          onClick={hinzufuegen}
          disabled={busy}
          className="rounded bg-dpsg-blue px-4 py-2 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Einladen"}
        </button>
      </div>
      {error && <p className="text-dpsg-red text-sm mt-2">{error}</p>}

      {inviteLink && (
        <div className="mt-3 rounded-lg bg-dpsg-blue/5 border border-dpsg-blue/30 p-3">
          <p className="text-sm font-bold text-dpsg-blue mb-1">Einladungslink (weitergeben):</p>
          <div className="flex gap-2">
            <input readOnly value={inviteLink} className="flex-1 text-xs rounded border border-neutral-300 px-2 py-1 bg-white" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded bg-dpsg-blue px-3 py-1 text-white text-sm font-bold"
            >
              {copied ? "✓" : "Kopieren"}
            </button>
          </div>
        </div>
      )}

      {zugriffe.length > 0 && (
        <ul className="mt-4 space-y-1">
          {zugriffe.map((z) => (
            <li key={z.id} className="flex items-center justify-between text-sm">
              <span>
                {z.name} <span className="text-neutral-500">{z.email}</span>
                {!z.aktiviert && <span className="ml-2 text-xs text-dpsg-red">Einladung offen</span>}
              </span>
              <button onClick={() => entziehen(z.id)} className="text-xs text-neutral-400 hover:text-dpsg-red">
                Entziehen
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
