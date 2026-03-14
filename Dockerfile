FROM node:24-bookworm
WORKDIR /app
RUN npm install -g pnpm@latest
COPY . .
RUN pnpm install
RUN cd apps/server && pnpm dlx prisma generate
RUN pnpm dlx turbo build --filter=server

# Instala dependências de sistema e o browser pelo mesmo contexto do Bun
RUN pnpm dlx playwright install-deps chromium
RUN pnpm dlx playwright install chromium

CMD ["node", "apps/server/dist/index.js"]