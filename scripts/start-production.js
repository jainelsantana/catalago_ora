const { spawn } = require("child_process");

const DEFAULT_RETRIES = 30;
const DEFAULT_RETRY_DELAY_MS = 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseComposeDatabaseHost() {
  return (
    process.env.USE_COMPOSE_DATABASE_HOST === "true" ||
    process.env.RUNNING_IN_DOCKER === "true"
  );
}

function getDatabaseFallbackHost() {
  if (process.env.DATABASE_FALLBACK_HOST) {
    return process.env.DATABASE_FALLBACK_HOST;
  }

  if (process.env.NEXTAUTH_URL) {
    try {
      return new URL(process.env.NEXTAUTH_URL).hostname;
    } catch {
      return "localhost";
    }
  }

  return "localhost";
}

function normalizeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const parsedUrl = new URL(databaseUrl);
  const isCoolifyRuntime = Boolean(process.env.COOLIFY_RESOURCE_UUID || process.env.COOLIFY_URL);

  if (parsedUrl.hostname === "db" && !shouldUseComposeDatabaseHost()) {
    parsedUrl.hostname = getDatabaseFallbackHost();
    process.env.DATABASE_URL = parsedUrl.toString();
  }

  if (parsedUrl.hostname === "HOST_INTERNO_DO_POSTGRES") {
    throw new Error(
      "DATABASE_URL still contains the placeholder HOST_INTERNO_DO_POSTGRES. Replace it with the real Coolify PostgreSQL internal host."
    );
  }

  if (isCoolifyRuntime && parsedUrl.hostname === "localhost") {
    throw new Error(
      "DATABASE_URL points to localhost. In Coolify, localhost is the application container, not PostgreSQL. Use the PostgreSQL Internal URL host."
    );
  }

  return process.env.DATABASE_URL;
}

function describeDatabaseUrl(databaseUrl) {
  try {
    const parsedUrl = new URL(databaseUrl);
    return `${parsedUrl.hostname}:${parsedUrl.port || "5432"}/${parsedUrl.pathname.replace(/^\//, "")}`;
  } catch {
    return "invalid DATABASE_URL";
  }
}

function runCommand(label, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`[startup] ${label}...`);

    const child = spawn(command, args, {
      env: process.env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function waitForDatabase() {
  const { PrismaClient } = require("@prisma/client");
  const retries = Number(process.env.DB_BOOTSTRAP_RETRIES || DEFAULT_RETRIES);
  const retryDelayMs = Number(process.env.DB_BOOTSTRAP_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const prisma = new PrismaClient();

    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      console.log("[startup] Database connection ready.");
      return;
    } catch (error) {
      await prisma.$disconnect().catch(() => {});

      const message = error instanceof Error ? error.message : String(error);
      console.error(`[startup] Database is not ready (${attempt}/${retries}): ${message}`);

      if (attempt === retries) {
        throw error;
      }

      await wait(retryDelayMs);
    }
  }
}

function startServer() {
  console.log("[startup] Starting Next.js server...");

  const server = spawn(process.execPath, ["server.js"], {
    env: process.env,
    stdio: "inherit",
  });

  const shutdown = (signal) => {
    server.kill(signal);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  server.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code || 0);
  });
}

async function main() {
  if (process.env.SKIP_DB_BOOTSTRAP === "true") {
    console.log("[startup] Database bootstrap skipped by SKIP_DB_BOOTSTRAP=true.");
    startServer();
    return;
  }

  const databaseUrl = normalizeDatabaseUrl();
  console.log(`[startup] Database target: ${describeDatabaseUrl(databaseUrl)}`);

  await waitForDatabase();
  await runCommand("Applying Prisma schema", process.execPath, [
    "node_modules/prisma/build/index.js",
    "db",
    "push",
    "--skip-generate",
  ]);
  await runCommand("Running Prisma seed", process.execPath, ["prisma/seed.js"]);

  startServer();
}

main().catch((error) => {
  console.error("[startup] Failed to initialize application:", error);
  process.exit(1);
});
