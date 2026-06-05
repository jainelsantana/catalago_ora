#!/bin/sh
set -e

if [ "${SKIP_DB_PUSH:-0}" != "1" ]; then
  echo "▶ Applying database schema..."
  ./node_modules/.bin/prisma db push
fi

if [ "${SKIP_DB_SEED:-0}" != "1" ]; then
  echo "▶ Seeding database..."
  ./node_modules/.bin/prisma db seed || echo "⚠ Seed skipped."
fi

echo "✅ Starting Next.js server..."
exec "$@"
