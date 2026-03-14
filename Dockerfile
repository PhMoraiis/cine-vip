FROM node:24-bookworm
WORKDIR /app
RUN npm install -g bun

COPY . .
RUN bun install
RUN cd apps/server && bunx prisma generate
RUN bunx turbo build --filter=server

# Install directly into the path Bun's playwright-core will look for
RUN bunx playwright install-deps chromium
RUN node /app/node_modules/.bun/playwright-core@1.55.1/node_modules/playwright-core/cli.js install chromium

CMD ["node", "apps/server/dist/index.js"]