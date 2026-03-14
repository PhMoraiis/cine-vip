FROM node:24-bookworm
WORKDIR /app
RUN npm install -g bun
COPY . .
RUN bun install
RUN cd apps/server && bunx prisma generate
RUN bunx turbo build --filter=server

# Instala dependências de sistema e o browser pelo mesmo contexto do Bun
RUN bunx playwright install-deps chromium
RUN bunx playwright install chromium

CMD ["node", "apps/server/dist/index.js"]