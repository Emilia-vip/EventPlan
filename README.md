# EventPlan (Meeting Point)

En app för att hitta och boka platser på event. Besökare bläddrar bland kommande event, skapar ett konto och bokar
en plats. Admins skapar event. Antalet platser är begränsat, och en plats kan inte bokas två gånger av samma konto.

Projektet är byggt för att visa hela vägen från kod till drift: tester, CI/CD, containrar, Kubernetes, autoscaling,
backup och övervakning.

## Arkitektur

```
webbläsare ──► cdn.<domän>  (nginx med statiska filer, React + Vite)
           └─► api.<domän>  (Fastify, Node)  ──► Postgres
```

| Del | Teknik |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind |
| Backend | Fastify 5, TypeScript, JWT-inloggning (jose), Zod-validering, Prometheus-metrics |
| Databas | Postgres, migreringar i `backend/migrations` |
| Drift | k3s på en VPS, Traefik, cert-manager (Let's Encrypt), GitHub Actions, GHCR |
| Övervakning | Prometheus, Grafana (färdig dashboard), Loki + Alloy |

Frontend och backend ligger på olika domäner, så backend tillåter frontendens domän via CORS (`CORS_ORIGIN`).

## Köra lokalt

Krav: Node 26 och en Postgres (här via Docker).

```bash
# 1. Databas
docker run -d --name eventplan-db -p 5432:5432 \
  -e POSTGRES_USER=eventapp -e POSTGRES_PASSWORD=eventapp -e POSTGRES_DB=eventapp postgres:17-alpine

# 2. Backend (http://localhost:3000)
cd backend
npm install
export DATABASE_URL=postgres://eventapp:eventapp@localhost:5432/eventapp
export JWT_SECRET=$(openssl rand -base64 48)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=hemligt123 npm run migrate   # skapar tabeller och ett admin-konto
npm run dev

# 3. Frontend (http://localhost:5173), i ett annat terminalfönster
cd frontend
npm install
npm run dev
```

I utvecklingsläge skickar Vite `/api` vidare till backend, så ingen CORS behövs lokalt. Logga in med
admin-kontot för att skapa event.

## Tester

```bash
cd backend  && npm test                  # unit + integration (integration startar Postgres med Testcontainers, kräver Docker)
cd frontend && npm run test:unit         # rena funktioner (validering, formatering, http-lagret)
cd frontend && npm run test:integration  # komponenttester (inloggning, skapa event, boka plats)
cd frontend && npm run test:e2e          # hela kedjan i riktig webbläsare, kräver Postgres på localhost:5432
```

E2E-testerna startar både backend och frontend själva och kör flödet admin skapar event → kund registrerar konto →
loggar in → bokar plats mot en riktig databas. Sätt `E2E_DATABASE_URL` om din Postgres ligger någon annanstans.
Samma sak körs i CI på varje pull request.

## Driftsättning

Merge till `main` testar, bygger images och driftsätter till k3s med `.github/workflows/ci-cd.yml`.
Installation av VPS, DNS, TLS, övervakning, hemligheter, backup och rollback finns beskrivet i
[deploy/README.md](deploy/README.md).
