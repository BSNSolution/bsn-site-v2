#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "Warning: prisma db push failed, continuing..."

# Run seed only if no admin user exists
echo "Checking if seed is needed..."
SEED_NEEDED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c === 0 ? 'yes' : 'no'); p.\$disconnect(); }).catch(() => { console.log('yes'); p.\$disconnect(); });
" 2>/dev/null)

if [ "$SEED_NEEDED" = "yes" ]; then
  echo "No users found - running seed..."
  node /app/prisma/seed.js 2>&1 || echo "Warning: seed failed, continuing..."
else
  echo "Database already has data, skipping seed."
fi

echo "Starting server..."
exec npm start
