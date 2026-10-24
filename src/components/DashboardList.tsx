"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUebergabe, deleteUebergabe } from "@/app/actions";
import { DeleteButton } from "./ui";

type Item = { id: string; titel: string };
type Role = "ADMIN" | "EDITOR" | "VIEWER";

export default function DashboardList({
  role,
  eigene,
  geteilt,
}: {
  role: Role;
  eigene: Item[];
  geteilt: Item[];
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const darfAnlegen = role === "ADMIN" || role === "EDITOR";

  async function neu() {
    setBusy(true);
    try {
      const id = await createUebergabe("Neue Übergabe");
      router.push(`/uebergabe/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dpsg-blue">Übergaben</h1>
        {darfAnlegen && (
          <button
            onClick={neu}
            disabled={busy}
            className="rounded-lg bg-dpsg-blue px-4 py-2 text-white font-bold hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "+ Neue Übergabe"}
          </button>
        )}
      </div>

      {darfAnlegen && (
        <section>
          <h2 className="font-bold text-neutral-700 mb-2">Meine Übergaben</h2>
          {eigene.length === 0 ? (
            <p className="text-neutral-500 text-sm">Noch keine eigene Übergabe.</p>
          ) : (
            <ul className="space-y-2">
              {eigene.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 hover:border-dpsg-blue transition">
                  <Link href={`/uebergabe/${u.id}`} className="font-bold text-dpsg-blue flex-1">
                    {u.titel}
                  </Link>
                  <DeleteButton onDelete={() => deleteUebergabe(u.id)} confirmText={`Übergabe "${u.titel}" mit allen Inhalten löschen?`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {geteilt.length > 0 && (
        <section>
          <h2 className="font-bold text-neutral-700 mb-2">Für mich freigegeben</h2>
          <ul className="space-y-2">
            {geteilt.map((u) => (
              <li key={u.id} className="rounded-lg border border-neutral-200 px-4 py-3 hover:border-dpsg-blue transition">
                <Link href={`/lesen/${u.id}`} className="font-bold text-dpsg-blue">
                  {u.titel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!darfAnlegen && geteilt.length === 0 && (
        <p className="text-neutral-500">Für dich wurde noch keine Übergabe freigegeben.</p>
      )}
    </div>
  );
}
