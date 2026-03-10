# Deploy Server no Dokploy com Docker

## Configuração no Dokploy

### 1. Criar Nova Aplicação
- **Nome**: `cine-vip-api`
- **Tipo**: Docker

### 2. Configuração do Build
- **Repository**: Seu repositório Git
- **Branch**: `main`
- **Dockerfile Path**: `apps/server/Dockerfile`
- **Context Path**: `.` (raiz do monorepo)
- **Build Args**: (nenhum necessário)

### 3. Variáveis de Ambiente (Environment Variables)
```
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=5&pool_timeout=10
CORS_ORIGIN=https://oncine.seudominio.com
BETTER_AUTH_SECRET=seu-secret-aleatorio-aqui
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

### 4. Porta
- **Container Port**: `3000`
- **Health Check Path**: `/api/health`
- **Health Check Interval**: `30s`

### 5. Deploy
- Clique em **Deploy**
- Aguarde o build (pode demorar ~3-5min na primeira vez devido ao Playwright)

## Testar Localmente

```bash
# Na raiz do projeto
cd /Users/philipe/Documents/Projetos/cine-vip

# Build da imagem
docker build -f apps/server/Dockerfile -t cine-vip-server .

# Rodar container (crie um .env.local com suas variáveis)
docker run -p 3000:3000 --env-file apps/server/.env.local cine-vip-server

# Testar health check
curl http://localhost:3000/api/health
```

## Troubleshooting

### Prisma Client Error
Se aparecer erro de "Prisma Client not generated":
- Verifique se `bunx prisma generate` rodou no build
- Cheque os logs de build no Dokploy

### Playwright Error
Se o scraper não funcionar:
- O Dockerfile já instala Chromium e dependências
- Verifique `PLAYWRIGHT_HEADLESS=true` está setado

### Database Connection
- Use connection pooling no DATABASE_URL
- Adicione `&connection_limit=5&pool_timeout=10`
- Se usar Prisma Accelerate, o formato é diferente: `prisma://accelerate.prisma-data.net/?api_key=...`

### CORS Issues
- Certifique-se que `CORS_ORIGIN` aponta para o domínio do frontend
- `BETTER_AUTH_URL` deve ser o domínio da API
- Os dois devem estar em `trustedOrigins` no auth.ts

## Recursos da Imagem
- **Tamanho final**: ~800MB (Chromium adiciona ~350MB)
- **Build time**: ~3-5 minutos
- **Memory usage**: ~150-300MB em idle, até 1GB durante scraping
