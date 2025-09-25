# Cinema API

API para gerenciamento de cinemas, datas e filmes em cartaz, com scrapers automatizados.

## Funcionalidades

- **Gestão de Cinemas**: Lista e atualiza cinemas disponíveis
- **Datas Disponíveis**: Obtém datas de sessões para cada cinema
- **Filmes em Cartaz**: Scraping automático de filmes e sessões
- **Cron Jobs**: Limpeza automática e scraping programado
- **Cache Inteligente**: Evita scrapers desnecessários

## Endpoints da API

### Cinemas

#### `GET /api/cinemas`

Obtém lista de todos os cinemas disponíveis.

**Resposta:**

```json
{
  "success": true,
  "source": "cache|scraping",
  "totalCinemas": 50,
  "cinemas": [
    {
      "id": "cuid",
      "code": "BSB",
      "name": "Cineflix Brasília",
      "state": "DF",
      "optgroupLabel": "Distrito Federal",
      "createdAt": "2024-09-25T...",
      "updatedAt": "2024-09-25T..."
    }
  ]
}
```

#### `POST /api/cinemas/refresh`

Força atualização da lista de cinemas.

### Datas Disponíveis

#### `GET /api/cinemas/:cinemaCode/dates`

Obtém datas disponíveis para um cinema específico.

**Parâmetros:**

- `cinemaCode`: Código do cinema (ex: "BSB", "SAL")

**Resposta:**

```json
{
  "success": true,
  "source": "cache|scraping",
  "cinema": "BSB",
  "totalDates": 7,
  "availableDates": [
    {
      "id": "cuid",
      "cinemaCode": "BSB",
      "value": "2024-09-25",
      "displayText": "Qua 25/09",
      "dayOfWeek": "Qua",
      "dayNumber": "25",
      "monthName": "09"
    }
  ]
}
```

### Filmes

#### `GET /api/cinemas/:cinemaCode/movies/:date`

Obtém filmes em cartaz para um cinema e data específicos.

**Parâmetros:**

- `cinemaCode`: Código do cinema (ex: "BSB")
- `date`: Data no formato YYYY-MM-DD (ex: "2024-09-25")

**Resposta (Cache):**

```json
{
  "success": true,
  "source": "cache",
  "cinema": "BSB",
  "date": "2024-09-25",
  "totalMovies": 10,
  "movies": [
    {
      "id": "cuid",
      "externalId": "cineflix-123",
      "title": "Filme Exemplo",
      "genre": "Ação",
      "duration": "120 min",
      "rating": "14",
      "synopsis": "Sinopse do filme...",
      "posterUrl": "https://...",
      "cinema": {
        "code": "BSB",
        "name": "Cineflix Brasília"
      },
      "sessions": [
        {
          "time": "14:30",
          "sessionType": "2D",
          "audioType": "DUB",
          "roomNumber": "1",
          "availableSeats": 50
        }
      ]
    }
  ]
}
```

**Resposta (Scraping Iniciado):**

```json
{
  "success": true,
  "source": "scraping_initiated",
  "cinema": "BSB",
  "date": "2024-09-25",
  "jobId": "job-cuid",
  "message": "Scraping iniciado. Use /api/jobs/:jobId para acompanhar"
}
```

### Jobs de Scraping

#### `GET /api/jobs/:jobId`

Verifica status de um job de scraping.

**Resposta:**

```json
{
  "success": true,
  "job": {
    "id": "job-cuid",
    "cinemaCode": "BSB",
    "date": "2024-09-25",
    "status": "COMPLETED|RUNNING|FAILED|PENDING",
    "startedAt": "2024-09-25T10:00:00Z",
    "completedAt": "2024-09-25T10:05:00Z",
    "moviesFound": 10,
    "error": null
  },
  "movies": [/* array de filmes se status = COMPLETED */]
}
```

### Health Check

#### `GET /api/health`

Verifica se a API está funcionando.

## Cron Jobs

### Limpeza Diária (00:00)

- Remove filmes de datas passadas
- Remove jobs antigos (>7 dias)
- Remove datas antigas (>30 dias)

### Scraping do Próximo Dia (23:30)

- Faz scraping automático do próximo dia
- Processa todos os cinemas cadastrados
- Salva dados para consumo instantâneo

## Banco de Dados

### Tabelas Principais

- **Cinema**: Cinemas disponíveis
- **Movie**: Filmes em cartaz
- **MovieSession**: Horários de sessões
- **AvailableDate**: Datas disponíveis por cinema
- **ScrapingJob**: Controle de jobs de scraping

## Fluxo de Uso Recomendado

1. **Obter Cinemas**: `GET /api/cinemas`
2. **Obter Datas**: `GET /api/cinemas/{code}/dates`
3. **Obter Filmes**: `GET /api/cinemas/{code}/movies/{date}`
   - Se retornar cache: usar dados imediatamente
   - Se iniciar scraping: acompanhar via `/api/jobs/{jobId}`

## Configuração

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:3000
```

### Scripts Disponíveis

```bash
bun run dev          # Desenvolvimento
bun run start        # Produção
bun run db:migrate   # Executar migrações
bun run db:studio    # Interface Prisma Studio
```

## Performance

- **Cache Inteligente**: Evita scrapers desnecessários
- **Jobs Assíncronos**: Scraping não bloqueia API
- **Limpeza Automática**: Remove dados antigos
- **Scraping Programado**: Dados sempre atualizados

## Monitoramento

Use os logs para acompanhar:

- Execução dos cron jobs
- Status dos scrapers
- Performance da API
- Erros e falhas

## Limitações

- Dependente do site Cineflix
- Scraping pode falhar se layout mudar
- Rate limiting automático entre requests
- Requer browser headless (Playwright)
