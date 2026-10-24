import { PrismaClient } from "@prisma/client";

// Singleton, damit im Dev-Modus nicht bei jedem Hot-Reload eine neue Connection entsteht.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
