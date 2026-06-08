import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function isDockerRuntime() {
  return process.env.RUNNING_IN_DOCKER === "true" || existsSync("/.dockerenv");
}

function getRuntimeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  try {
    const parsedUrl = new URL(databaseUrl);

    // `db` only resolves inside Docker Compose. Outside Docker, the mapped
    // Postgres port is reached through localhost.
    if (parsedUrl.hostname === "db" && !isDockerRuntime()) {
      parsedUrl.hostname = "localhost";
      const rewrittenUrl = parsedUrl.toString();
      process.env.DATABASE_URL = rewrittenUrl;
      return rewrittenUrl;
    }
  } catch {
    return databaseUrl;
  }

  return databaseUrl;
}

const prismaClientSingletonFactory = () => {
  const databaseUrl = getRuntimeDatabaseUrl();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingletonFactory();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
