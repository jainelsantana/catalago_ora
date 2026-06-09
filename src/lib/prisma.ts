import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function shouldUseComposeDatabaseHost() {
  return process.env.RUNNING_IN_DOCKER === "true";
}

function getDatabaseFallbackHost() {
  if (process.env.DATABASE_FALLBACK_HOST) {
    return process.env.DATABASE_FALLBACK_HOST;
  }

  if (process.env.NODE_ENV !== "production" && process.env.NEXTAUTH_URL) {
    try {
      return new URL(process.env.NEXTAUTH_URL).hostname;
    } catch {
      return "localhost";
    }
  }

  return "localhost";
}

function getRuntimeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  try {
    const parsedUrl = new URL(databaseUrl);

    // `db` only resolves inside Docker Compose. Deployments that run the app
    // outside that Compose network must use the host that exposes Postgres.
    if (parsedUrl.hostname === "db" && !shouldUseComposeDatabaseHost()) {
      const fallbackHost = getDatabaseFallbackHost();

      if (fallbackHost && (fallbackHost !== "localhost" || process.env.NODE_ENV !== "production")) {
        parsedUrl.hostname = fallbackHost;
        const rewrittenUrl = parsedUrl.toString();
        process.env.DATABASE_URL = rewrittenUrl;
        return rewrittenUrl;
      }
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
