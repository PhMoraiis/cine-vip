FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install
RUN cd apps/server && bunx prisma generate
RUN bun run turbo build --filter=server
RUN bunx playwright install chromium --with-deps
CMD ["bun", "apps/server/dist/index.js"]