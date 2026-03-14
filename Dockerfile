FROM node:24-bookworm

RUN npm install -g bun

WORKDIR /app

COPY . .

RUN bun install
RUN bunx prisma generate
RUN bunx turbo build --filter=server
RUN bunx playwright install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]