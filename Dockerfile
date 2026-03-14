FROM node:24-bookworm

RUN npm install -g bun

WORKDIR /app

COPY . .

RUN bun install --ignore-scripts
RUN cd apps/server && bunx prisma generate
RUN bunx turbo build --filter=server
RUN ./node_modules/.bin/playwright install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]