#!/bin/sh
set -e

# Extract database host and port from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=${DATABASE_URL#*@}
DB_HOST=${DB_HOST%:*}
DB_PORT=${DATABASE_URL##*:}
DB_PORT=${DB_PORT%/*}

# Default values if parsing fails
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "🔍 Waiting for database at $DB_HOST:$DB_PORT..."

# Wait for database to be ready with exponential backoff
RETRY_COUNT=0
MAX_RETRIES=60
WAIT_TIME=1

while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
    echo "❌ Database not available after $MAX_RETRIES retries"
    exit 1
  fi
  
  echo "⏳ Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying in ${WAIT_TIME}s..."
  sleep $WAIT_TIME
  
  # Exponential backoff: increase wait time but cap at 5 seconds
  WAIT_TIME=$((WAIT_TIME * 2))
  if [ $WAIT_TIME -gt 5 ]; then
    WAIT_TIME=5
  fi
done

echo "✅ Database is ready!"

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
