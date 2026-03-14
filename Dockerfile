FROM node:24-bookworm
WORKDIR /app
RUN npm install -g bun

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY . .
RUN bun install
RUN cd apps/server && bunx prisma generate
RUN bunx turbo build --filter=server
RUN bunx playwright install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]