"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser, newInviteToken, inviteLinkFor } from "@/lib/session";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

const INVITE_DAYS = 14;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Kein Zugriff (Admin erforderlich).");
  return user;
}

// Darf der aktuelle User diese Übergabe verwalten (Owner oder Admin)?
async function requireCanManage(uebergabeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nicht angemeldet.");
  const ub = await prisma.uebergabe.findUnique({ where: { id: uebergabeId } });
  if (!ub) throw new Error("Übergabe nicht gefunden.");
  if (user.role !== "ADMIN" && ub.ownerId !== user.id) throw new Error("Kein Zugriff.");
  return { user, uebergabe: ub };
}

// ---------- Nutzerverwaltung (Admin) ----------
export async function createUser(email: string, name: string, role: Role): Promise<{ inviteLink: string }> {
  await requireAdmin();
  const mail = email.trim().toLowerCase();
  if (!mail) throw new Error("E-Mail erforderlich.");

  const existing = await prisma.user.findUnique({ where: { email: mail } });
  if (existing) throw new Error("Diese E-Mail existiert bereits.");

  const inviteToken = newInviteToken();
  await prisma.user.create({
    data: {
      email: mail,
      name: name.trim() || mail,
      role,
      inviteToken,
      inviteExpires: new Date(Date.now() + INVITE_DAYS * 864e5),
    },
  });
  return { inviteLink: inviteLinkFor(inviteToken) };
}

export async function deleteUser(id: number) {
  const admin = await requireAdmin();
  if (admin.id === id) throw new Error("Du kannst dich nicht selbst löschen.");
  await prisma.user.delete({ where: { id } });
}

export async function regenerateInvite(id: number): Promise<{ inviteLink: string }> {
  await requireAdmin();
  const inviteToken = newInviteToken();
  await prisma.user.update({
    where: { id },
    data: { inviteToken, inviteExpires: new Date(Date.now() + INVITE_DAYS * 864e5), passwordHash: null },
  });
  return { inviteLink: inviteLinkFor(inviteToken) };
}

// ---------- Zugriff pro Übergabe (Owner/Admin) ----------
// Lädt eine Person ein (falls nötig) und gibt ihr Lesezugriff auf die Übergabe.
export async function grantAccess(
  uebergabeId: string,
  email: string,
  name?: string
): Promise<{ inviteLink?: string; status: "invited" | "added" }> {
  await requireCanManage(uebergabeId);
  const mail = email.trim().toLowerCase();
  if (!mail) throw new Error("E-Mail erforderlich.");

  let user = await prisma.user.findUnique({ where: { email: mail } });
  let inviteLink: string | undefined;
  let status: "invited" | "added" = "added";

  if (!user) {
    const inviteToken = newInviteToken();
    user = await prisma.user.create({
      data: {
        email: mail,
        name: name?.trim() || mail,
        role: "VIEWER",
        inviteToken,
        inviteExpires: new Date(Date.now() + INVITE_DAYS * 864e5),
      },
    });
    inviteLink = inviteLinkFor(inviteToken);
    status = "invited";
  } else if (!user.passwordHash && user.inviteToken) {
    // existiert, aber Einladung noch offen -> vorhandenen Link zurückgeben
    inviteLink = inviteLinkFor(user.inviteToken);
    status = "invited";
  }

  await prisma.zugriff.upsert({
    where: { userId_uebergabeId: { userId: user.id, uebergabeId } },
    update: {},
    create: { userId: user.id, uebergabeId },
  });

  return { inviteLink, status };
}

export async function revokeAccess(zugriffId: string) {
  const zugriff = await prisma.zugriff.findUnique({ where: { id: zugriffId } });
  if (!zugriff) return;
  await requireCanManage(zugriff.uebergabeId);
  await prisma.zugriff.delete({ where: { id: zugriffId } });
}
