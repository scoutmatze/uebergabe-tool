import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { randomBytes } from "node:crypto";

// Aktueller User inkl. Rolle (oder null).
export async function getCurrentUser() {
  const token = await verifyToken();
  if (!token) return null;
  return prisma.user.findUnique({ where: { id: token.userId } });
}

export function newInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export function inviteLinkFor(token: string): string {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  return `${base}/einladung/${token}`;
}
