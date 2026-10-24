import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import LeseAnsicht from "@/components/LeseAnsicht";

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

  // Auf eine schlanke, serialisierbare Struktur für die Client-Suche reduzieren
  const themenkomplexe = uebergabe.themenkomplexe.map((tk) => ({
    id: tk.id,
    titel: tk.titel,
    unterthemen: tk.unterthemen.map((ut) => ({
      id: ut.id,
      titel: ut.titel,
      materialien: ut.materialien.map((m) => ({
        id: m.id,
        art: m.art as "FILE" | "LINK",
        titel: m.titel,
        url: m.url,
      })),
      eintraege: ut.eintraege.map((e) => ({
        id: e.id,
        transcript: e.transcript,
        stichpunkte: e.stichpunkte.map((s) => ({ id: s.id, text: s.text })),
      })),
    })),
  }));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto mb-4">
        <Link href="/dashboard" className="text-sm text-dpsg-blue hover:underline">
          ← Alle Übergaben
        </Link>
      </div>
      <LeseAnsicht titel={uebergabe.titel} themenkomplexe={themenkomplexe} />
    </main>
  );
}
