import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingletonFactory = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingletonFactory();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
