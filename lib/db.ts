
import { PrismaClient } from "@prisma/client";

// Tipar correctamente globalThis para evitar el error de TS
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// En desarrollo reutilizamos la instancia para evitar conexiones múltiples en hot-reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
