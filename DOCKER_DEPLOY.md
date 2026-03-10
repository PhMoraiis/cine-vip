# 🐳 Deploy com Docker no Dokploy

Este guia explica como fazer deploy da aplicação no Dokploy usando Docker, resolvendo problemas de incompatibilidade do Prisma com Nixpacks.

## 📦 Estrutura

- **Backend**: `apps/server/Dockerfile`
- **Frontend**: `apps/web/Dockerfile`

## 🚀 Deploy no Dokploy

### Backend (API)

#### 1. Criar Aplicação
- Nome: `cine-vip-api`
- Tipo: **Docker**
- Repository: Seu repositório Git
- Branch: `main`

#### 2. Configuração Docker
- **Dockerfile Path**: `apps/server/Dockerfile`
- **Build Context Path**: `.` (raiz do monorepo)
- **Container Port**: `3000`

#### 3. Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
CORS_ORIGIN=https://oncine.seudominio.com
BETTER_AUTH_SECRET=gere-um-secret-seguro-aqui
BETTER_AUTH_URL=https://api.seudominio.com
NODE_ENV=production
PORT=3000
API_VERSION=v1
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
RESEND_API_KEY=seu-resend-api-key
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=0
SCRAPING_STALE_MINUTES=30
```

#### 4. Health Check
- **Path**: `/api/health`
- **Interval**: 30s
- **Timeout**: 3s

#### 5. Domínio
Configure: `api.seudominio.com`

---

### Frontend (Web)

#### 1. Criar Aplicação
- Nome: `cine-vip-web`
- Tipo: **Docker**
- Repository: Seu repositório Git
- Branch: `main`

#### 2. Configuração Docker
- **Dockerfile Path**: `apps/web/Dockerfile`
- **Build Context Path**: `.` (raiz do monorepo)
- **Container Port**: `3000`

#### 3. Variáveis de Ambiente
```env
NEXT_PUBLIC_SERVER_URL=https://api.seudominio.com
```

#### 4. Health Check
- **Path**: `/`
- **Interval**: 30s
- **Timeout**: 3s

#### 5. Domínio
Configure: `oncine.seudominio.com`

---

## 🧪 Testar Localmente

### Backend

```bash
# Build
docker build -f apps/server/Dockerfile -t cine-vip-server .

# Run (crie .env com as variáveis)
docker run -p 3000:3000 --env-file apps/server/.env cine-vip-server

# Teste
curl http://localhost:3000/api/health
```

### Frontend

```bash
# Build
docker build -f apps/web/Dockerfile -t cine-vip-web .

# Run
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_SERVER_URL=http://localhost:3000 \
  cine-vip-web

# Acesse
open http://localhost:3001
```

### Ambos com Docker Compose

```bash
# Na raiz do projeto
docker-compose up --build

# Backend: http://localhost:3000
# Frontend: http://localhost:3001
```

---

## 🔧 Recursos e Limitações

### Backend
- **Tamanho da imagem**: ~800MB (Chromium + deps)
- **Build time**: 3-5 minutos (primeira vez)
- **Memória**: 150-300MB idle, até 1GB durante scraping
- **Playwright**: Chromium já instalado e configurado

### Frontend
- **Tamanho da imagem**: ~200MB
- **Build time**: 2-3 minutos
- **Memória**: ~100-150MB

---

## 🐛 Troubleshooting

### ❌ Prisma Client Error
```
PrismaClientInitializationError: Prisma Client could not locate...
```

**Solução**: O Dockerfile já resolve isso com:
```dockerfile
RUN bunx prisma generate
```

### ❌ Playwright Browser Error
```
browserType.launch: Executable doesn't exist
```

**Solução**: O Dockerfile instala Chromium:
```dockerfile
RUN bunx playwright install chromium --with-deps
```

### ❌ Database Connection Failed
**Soluções**:
1. Use connection pooling: `?connection_limit=5&pool_timeout=10`
2. Se usar Prisma Accelerate, o formato muda:
   ```
   DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
   ```
3. Verifique se o IP do Dokploy está whitelistado no seu DB

### ❌ CORS Error no Frontend
**Verificar**:
1. `CORS_ORIGIN` no backend = URL do frontend
2. `BETTER_AUTH_URL` = URL da API
3. Ambas URLs em `trustedOrigins` no `auth.ts`

### ❌ Build Lento/Timeout
Se o build timeout no Dokploy:
1. Aumente o timeout de build para 10-15min
2. Use build cache (Dokploy faz isso automaticamente)
3. Na segunda build será muito mais rápido (~1-2min)

---

## 📝 Notas

### Migrações de Banco
O Dockerfile **não** roda migrações automaticamente. Para aplicá-las:

**Opção 1**: Rodar manualmente antes do deploy
```bash
bun db:migrate
```

**Opção 2**: Adicionar ao Dockerfile (antes do CMD):
```dockerfile
RUN bunx prisma migrate deploy
```

**Opção 3**: Script de inicialização
Crie `apps/server/start.sh`:
```bash
#!/bin/bash
bunx prisma migrate deploy
bun run dist/index.js
```

E use no Dockerfile:
```dockerfile
CMD ["./start.sh"]
```

### Recursos do Servidor
Recomendações mínimas no Dokploy:
- **Backend**: 1GB RAM, 1 CPU
- **Frontend**: 512MB RAM, 0.5 CPU

### Ordem de Deploy
1. Subir **backend** primeiro
2. Testar `https://api.seudominio.com/api/health`
3. Configurar `NEXT_PUBLIC_SERVER_URL` no frontend
4. Subir **frontend**

---

## ✅ Checklist de Deploy

Backend:
- [ ] DATABASE_URL configurado
- [ ] Secrets configurados (BETTER_AUTH_SECRET, GOOGLE_CLIENT_*, etc)
- [ ] CORS_ORIGIN aponta para o frontend
- [ ] BETTER_AUTH_URL aponta para a própria API
- [ ] Prisma migrations aplicadas
- [ ] Health check funcionando

Frontend:
- [ ] NEXT_PUBLIC_SERVER_URL aponta para a API
- [ ] Build standalone configurado no next.config.ts
- [ ] Domínio configurado
- [ ] Página carregando

Integração:
- [ ] Login funcionando
- [ ] Scraping funcionando
- [ ] CORS sem erros
- [ ] Cookies sendo salvos
