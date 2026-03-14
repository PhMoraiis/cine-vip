FROM node:24-bookworm

WORKDIR /app

COPY . .

RUN npm install --ignore-scripts
RUN cd apps/server && bunx prisma generate
RUN npm run turbo build --filter=server
RUN npx playwright install chromium --with-deps

CMD ["node", "apps/server/dist/index.js"]