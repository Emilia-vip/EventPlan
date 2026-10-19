# Kommandon – EventPlan backend

## Installation

```bash
cd backend
npm install
```

## Databas (Docker)

Körs från projektroten (`EventPlan/`), där `docker-compose.yml` ligger.

```bash
docker compose up -d          # Starta Postgres
docker compose down           # Stoppa Postgres
docker compose down -v        # Stoppa och radera all data
docker compose ps             # Visa status
docker compose logs -f db     # Följ databasens loggar
```

Kör migrationer mot dev-databasen:

```bash
docker compose exec -T db psql -U eventapp -d eventapp < backend/migrations/001_init.sql
```

Öppna en psql-prompt:

```bash
docker compose exec db psql -U eventapp -d eventapp
```

## Starta servern

```bash
npm run dev                   # Startar på http://localhost:3000 (läser .env)
```

## Tester

```bash
npm test                      # Alla tester (unit + integration)
npm run test:unit             # Bara enhetstester – kräver inte Docker
npm run test:integration      # Bara integrationstester – kräver att Docker är igång
npx vitest                    # Watch-läge
npx vitest run tests/integration/events.test.ts   # En enskild testfil
```

Integrationstesterna startar en egen Postgres-container med Testcontainers,
kör migrationerna och stänger containern när testerna är klara.
Dev-databasen påverkas inte.

## Testa API:t manuellt

```bash
curl http://localhost:3000/events

curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Fest","startsAt":"2030-12-24T18:00:00Z","capacity":10}'

curl http://localhost:3000/events/<id>

curl -X POST http://localhost:3000/events/<id>/registrations \
  -H "Content-Type: application/json" \
  -d '{"name":"Anna","email":"anna@example.com"}'
```

## Felsökning

```bash
docker info                   # Kolla att Docker körs
lsof -i :5432                 # Vad använder Postgres-porten?
lsof -i :3000                 # Vad använder API-porten?
```
