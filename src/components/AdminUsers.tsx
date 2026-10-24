"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, deleteUser, regenerateInvite } from "@/app/admin-actions";

type Role = "ADMIN" | "EDITOR" | "VIEWER";
type UserItem = { id: number; email: string; name: string; role: Role; aktiviert: boolean };

function CopyBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg bg-dpsg-blue/5 border border-dpsg-blue/30 p-3">
      <p className="text-sm font-bold text-dpsg-blue mb-1">Einladungslink (weitergeben):</p>
      <div className="flex gap-2">
        <input readOnly value={link} className="flex-1 text-xs rounded border border-neutral-300 px-2 py-1 bg-white" />
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded bg-dpsg-blue px-3 py-1 text-white text-sm font-bold"
        >
          {copied ? "✓" : "Kopieren"}
        </button>
      </div>
    </div>
  );
}

export default function AdminUsers({ users }: { users: UserItem[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const router = useRouter();

  async function anlegen() {
    setBusy(true);
    setError(null);
    setInviteLink(null);
    try {
      const { inviteLink } = await createUser(email, name, role);
      setInviteLink(inviteLink);
      setEmail("");
      setName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  async function neuEinladen(id: number) {
    const { inviteLink } = await regenerateInvite(id);
    setInviteLink(inviteLink);
    router.refresh();
  }

  async function entfernen(id: number) {
    if (!confirm("Diesen Nutzer wirklich löschen?")) return;
    await deleteUser(id);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-dpsg-blue">Nutzerverwaltung</h1>

      <section className="rounded-lg border border-neutral-200 p-4">
        <h2 className="font-bold text-dpsg-blue mb-3">Neue Person einladen</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dpsg-blue"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="EDITOR">Editor (darf Übergaben erstellen)</option>
            <option value="VIEWER">Viewer (nur lesen)</option>
            <option value="ADMIN">Admin (volle Rechte)</option>
          </select>
          <button
            onClick={anlegen}
            disabled={busy}
            className="rounded bg-dpsg-blue px-4 py-2 text-white font-bold hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "Einladen"}
          </button>
        </div>
        {error && <p className="text-dpsg-red text-sm mt-2">{error}</p>}
        {inviteLink && <CopyBox link={inviteLink} />}
      </section>

      <section>
        <h2 className="font-bold text-dpsg-blue mb-3">Nutzer</h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
              <div>
                <span className="font-bold text-neutral-800">{u.name}</span>
                <span className="text-neutral-500 text-sm ml-2">{u.email}</span>
                <span className="ml-2 text-xs rounded bg-neutral-100 px-2 py-0.5">{u.role}</span>
                {!u.aktiviert && <span className="ml-2 text-xs text-dpsg-red">Einladung offen</span>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                {!u.aktiviert && (
                  <button onClick={() => neuEinladen(u.id)} className="text-dpsg-blue hover:underline">
                    Link neu
                  </button>
                )}
                <button onClick={() => entfernen(u.id)} className="text-neutral-400 hover:text-dpsg-red">
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
