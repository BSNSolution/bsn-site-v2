# Use Node.js 18 LTS
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
# Compile seed.ts to JS for production seeding
RUN npx -p typescript tsc prisma/seed.ts --outDir prisma/compiled --esModuleInterop --module commonjs --target ES2022 --skipLibCheck --resolveJsonModule 2>/dev/null; \
    mv prisma/compiled/seed.js prisma/seed.js 2>/dev/null || echo "seed compile skipped"

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL 1.1 compat (required by Prisma engine on Alpine)
RUN apk add --no-cache openssl1.1-compat 2>/dev/null || apk add --no-cache openssl

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Change ownership
RUN chown -R fastify:nodejs /app
USER fastify

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# No Docker healthcheck — Traefik handles routing health detection
# Removing HEALTHCHECK prevents Docker Swarm restart loops

# Start the server
CMD ["/app/docker-entrypoint.sh"]
