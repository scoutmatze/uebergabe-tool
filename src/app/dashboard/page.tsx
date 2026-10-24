import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import DashboardList from "@/components/DashboardList";
import ChangePin from "@/components/ChangePin";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const eigene = await prisma.uebergabe.findMany({
    where: { ownerId: me.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, titel: true },
  });

  const zugriffe = await prisma.zugriff.findMany({
    where: { userId: me.id },
    include: { uebergabe: { select: { id: true, titel: true } } },
  });
  const geteilt = zugriffe.map((z) => z.uebergabe);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {me.role === "ADMIN" && (
            <Link href="/admin" className="text-sm font-bold text-dpsg-blue hover:underline">
              Nutzerverwaltung
            </Link>
          )}
          <ChangePin />
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-neutral-500 hover:text-dpsg-red">Abmelden</button>
        </form>
      </div>
      <DashboardList role={me.role} eigene={eigene} geteilt={geteilt} />
    </main>
  );
}
