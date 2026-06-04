#!/bin/sh
set -e

echo "▶ Applying database schema..."
./node_modules/.bin/prisma db push

echo "▶ Seeding database..."
node prisma/seed.js || echo "⚠ Seed skipped."

echo "✅ Starting Next.js server..."
exec node server.js
