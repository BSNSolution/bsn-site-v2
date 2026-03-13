#!/bin/sh
set -e
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "Warning: prisma db push failed, continuing..."
echo "Starting server..."
exec npm start
