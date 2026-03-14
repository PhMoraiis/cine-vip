FROM node:24-bookworm

RUN npm install -g bun

WORKDIR /app

COPY . .

RUN bun install --ignore-scripts
RUN cd apps/server && bunx prisma generate
RUN bunx turbo build --filter=server
RUN node /app/node_modules/.bun/playwright-core@1.55.1/node_modules/playwright-core/cli.js install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]