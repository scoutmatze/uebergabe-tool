import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import UebergabeDetail from "@/components/UebergabeDetail";
import ZugriffPanel from "@/components/ZugriffPanel";

export default async function UebergabePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { id } = await params;
  const uebergabe = await prisma.uebergabe.findUnique({
    where: { id },
    include: {
      zugriffe: { include: { user: { select: { email: true, name: true, passwordHash: true } } } },
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

  const canManage = me.role === "ADMIN" || uebergabe.ownerId === me.id;
  if (!canManage) {
    const hatZugriff = uebergabe.zugriffe.some((z) => z.userId === me.id);
    redirect(hatZugriff ? `/lesen/${id}` : "/dashboard");
  }

  const zugriffe = uebergabe.zugriffe.map((z) => ({
    id: z.id,
    email: z.user.email,
    name: z.user.name,
    aktiviert: !!z.user.passwordHash,
  }));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto flex justify-between mb-6">
        <Link href="/dashboard" className="text-sm text-dpsg-blue hover:underline">
          ← Übergaben
        </Link>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-neutral-500 hover:text-dpsg-red">Abmelden</button>
        </form>
      </div>
      <UebergabeDetail uebergabe={uebergabe} />
      <div className="max-w-3xl mx-auto mt-10">
        <ZugriffPanel uebergabeId={uebergabe.id} zugriffe={zugriffe} />
      </div>
    </main>
  );
}
