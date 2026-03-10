# Build stage
FROM oven/bun:1.2.16-slim AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json bun.lock* bunfig.toml ./
COPY turbo.json ./

# Copy web app files
COPY apps/web/package.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/components.json ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/middleware.ts ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy web source code
COPY apps/web ./apps/web/

# Build Next.js app
WORKDIR /app/apps/web
RUN bun run build

# Production stage
FROM oven/bun:1.2.16-slim AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun run -e 'fetch("http://localhost:3000").then(r => r.ok || process.exit(1))' || exit 1

# Start Next.js
CMD ["bun", "run", "server.js"]
