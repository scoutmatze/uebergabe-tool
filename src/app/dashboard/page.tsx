import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // Admin sieht alle Übergaben; sonst eigene + freigegebene.
  let liste: { id: string; titel: string }[];
  if (me.role === "ADMIN") {
    liste = await prisma.uebergabe.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, titel: true },
    });
  } else {
    const eigene = await prisma.uebergabe.findMany({
      where: { ownerId: me.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, titel: true },
    });
    const zugriffe = await prisma.zugriff.findMany({
      where: { userId: me.id },
      include: { uebergabe: { select: { id: true, titel: true } } },
    });
    // Duplikate vermeiden, falls Owner zugleich Zugriff hat
    const map = new Map<string, { id: string; titel: string }>();
    [...eigene, ...zugriffe.map((z) => z.uebergabe)].forEach((u) => map.set(u.id, u));
    liste = [...map.values()];
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-8">
        <p className="text-sm text-neutral-500">
          Angemeldet als {me.name}
        </p>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-neutral-500 hover:text-dpsg-red">Abmelden</button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-dpsg-blue mb-4">Übergabe-Archiv</h1>

        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
          <span className="font-bold">📁 Archiv.</span> Die Übergaben sind abgeschlossen – hier kann nur
          noch gelesen und durchsucht werden. Neue Themen oder Aufnahmen lassen sich nicht mehr hinzufügen.
        </div>

        {liste.length === 0 ? (
          <p className="text-neutral-500">Für dich ist derzeit keine Übergabe freigegeben.</p>
        ) : (
          <ul className="space-y-2">
            {liste.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border border-neutral-200 px-4 py-3 hover:border-dpsg-blue transition"
              >
                <Link href={`/lesen/${u.id}`} className="font-bold text-dpsg-blue">
                  {u.titel}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
