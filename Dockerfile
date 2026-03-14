FROM node:24-bookworm
WORKDIR /app

# Install Bun
RUN npm install -g bun

COPY . .
RUN bun install
RUN cd apps/server && bunx prisma generate
RUN npm run turbo build --filter=server

# Install Chromium using bunx so it lands in Bun's path
RUN bunx playwright install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]