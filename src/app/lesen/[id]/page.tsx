import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function LesenPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { id } = await params;
  const uebergabe = await prisma.uebergabe.findUnique({
    where: { id },
    include: {
      zugriffe: { select: { userId: true } },
      themenkomplexe: {
        orderBy: { position: "asc" },
        include: {
          unterthemen: {
            orderBy: { position: "asc" },
            include: {
              materialien: { orderBy: { position: "asc" } },
              eintraege: {
                orderBy: { createdAt: "asc" },
                include: { stichpunkte: { orderBy: { position: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!uebergabe) redirect("/dashboard");

  const darfLesen =
    me.role === "ADMIN" ||
    uebergabe.ownerId === me.id ||
    uebergabe.zugriffe.some((z) => z.userId === me.id);
  if (!darfLesen) redirect("/dashboard");

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-6">
          <form action="/api/auth/logout" method="post">
            <button className="text-sm text-neutral-500 hover:text-dpsg-red">Abmelden</button>
          </form>
        </div>

        <header className="mb-8">
          <p className="text-dpsg-red font-bold tracking-widest uppercase text-sm">DPSG Übergabe</p>
          <h1 className="text-3xl font-bold text-dpsg-blue mt-1">{uebergabe.titel}</h1>
        </header>

        {uebergabe.themenkomplexe.length === 0 && (
          <p className="text-neutral-500">Diese Übergabe enthält noch keine Inhalte.</p>
        )}

        <div className="space-y-10">
          {uebergabe.themenkomplexe.map((tk) => (
            <section key={tk.id}>
              <h2 className="text-xl font-bold text-dpsg-blue border-l-4 border-dpsg-blue pl-3">{tk.titel}</h2>
              <div className="mt-4 space-y-6 pl-3">
                {tk.unterthemen.map((ut) => (
                  <div key={ut.id}>
                    <h3 className="font-bold text-neutral-800">{ut.titel}</h3>

                    {ut.eintraege.length === 0 && (
                      <p className="text-neutral-400 text-sm mt-1">— noch keine Aufnahme —</p>
                    )}

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
    </main>
  );
}
