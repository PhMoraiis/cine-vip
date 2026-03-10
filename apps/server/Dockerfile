# Build stage
FROM oven/bun:1.2.16-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json bun.lock* bunfig.toml ./
COPY turbo.json ./

# Copy server app files
COPY apps/server/package.json ./apps/server/
COPY apps/server/prisma ./apps/server/prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy server source code
COPY apps/server ./apps/server/

# Generate Prisma Client
WORKDIR /app/apps/server
RUN bunx prisma generate

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.16-slim AS runner

# Install OpenSSL and Playwright dependencies for production
RUN apt-get update -y && \
    apt-get install -y \
    openssl \
    ca-certificates \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    wget \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./

# Install Playwright browsers in production
RUN bunx playwright install chromium --with-deps

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e 'fetch("http://localhost:3000/api/health").then(r => r.ok || process.exit(1))' || exit 1

# Start command
CMD ["bun", "run", "dist/index.js"]
