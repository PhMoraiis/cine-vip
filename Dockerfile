FROM node:24-bookworm
WORKDIR /app

RUN npm install -g pnpm@latest

COPY . .

RUN pnpm install

# Usa o prisma já instalado, sem baixar nada extra
RUN cd apps/server && pnpm exec prisma generate

RUN pnpm exec turbo build --filter=server

# Playwright: instala deps de sistema e o browser via pnpm exec
RUN cd apps/server && pnpm exec playwright install-deps chromium
RUN cd apps/server && pnpm exec playwright install chromium

# Limpa caches para reduzir tamanho da imagem final
RUN pnpm store prune && npm cache clean --force

CMD ["node", "apps/server/dist/index.js"]