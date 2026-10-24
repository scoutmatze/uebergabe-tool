import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import AdminUsers from "@/components/AdminUsers";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") redirect("/dashboard");

  const raw = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });
  const users = raw.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    aktiviert: !!u.passwordHash,
  }));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto flex justify-between mb-6">
        <Link href="/dashboard" className="text-sm text-dpsg-blue hover:underline">
          ← Übergaben
        </Link>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-neutral-500 hover:text-dpsg-red">Abmelden</button>
        </form>
      </div>
      <AdminUsers users={users} />
    </main>
  );
}
