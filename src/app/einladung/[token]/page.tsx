import { prisma } from "@/lib/db";
import AcceptInvite from "@/components/AcceptInvite";

export default async function EinladungPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  const valid = !!user && (!user.inviteExpires || user.inviteExpires >= new Date());

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-dpsg-red font-bold tracking-widest uppercase text-sm">DPSG Übergabe</p>
        {valid ? (
          <>
            <h1 className="text-2xl font-bold text-dpsg-blue mt-1">Willkommen, {user!.name}</h1>
            <p className="text-neutral-600 mt-2 mb-6">Bitte lege deinen persönlichen PIN fest.</p>
            <AcceptInvite token={token} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-dpsg-blue mt-1">Einladung ungültig</h1>
            <p className="text-neutral-600 mt-2">
              Dieser Einladungslink ist ungültig oder abgelaufen. Bitte wende dich an die Person, die dich eingeladen hat.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
