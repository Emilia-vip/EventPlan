# Deploy av EventPlan

Allt körs på en VPS med k3s. Backend nås på `api.<domän>` och statiska filer på `cdn.<domän>`, båda över HTTPS.

```
GitHub (merge till main)
  └─ GitHub Actions: test → bygg images → deploy.sh
        └─ k3s på VPS
             ├─ Traefik (ingress, TLS, load balancer)
             │    ├─ api.<domän> → backend (2–6 pods, HPA)
             │    └─ cdn.<domän> → frontend (nginx)
             ├─ postgres (StatefulSet + PVC)
             ├─ db-backup (CronJob, varje natt till S3)
             └─ monitoring: Prometheus + Grafana (metrics), Loki + Alloy (loggar)
```

## 1. VPS och k3s

På VPS:en (t.ex. VPSDime, Ubuntu):

```bash
curl -sfL https://get.k3s.io | sh -
```

k3s installerar Traefik (ingress/load balancer) och metrics-server (krävs för HPA) automatiskt.

## 2. DNS

Skapa två A-records hos din domänleverantör, båda pekar på VPS:ens IP:

- `api.<domän>` → IP
- `cdn.<domän>` → IP

## 3. TLS (cert-manager)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
# Vänta tills cert-manager är uppe, byt sedan e-post i filen och applicera den:
kubectl apply -f deploy/setup/cert-manager-issuer.yaml
```

Efter detta skickar Traefik all `http://`-trafik vidare till `https://` (se nästa steg).

## 3b. HTTP → HTTPS

k3s levererar Traefik som standard men skickar inte `http://` vidare till `https://`. Aktivera omdirigeringen
en gång (k3s konfigurerar om Traefik själv, ingen helm-installation behövs):

```bash
kubectl apply -f deploy/setup/traefik-https-redirect.yaml
curl -I http://api.<domän>   # ska ge 301 med Location: https://api.<domän>/
```

## 4. Övervakning (en gång)

Installera Prometheus, Grafana, Loki och Alloy. Grafana-login ligger i en Secret:

```bash
kubectl create namespace monitoring
kubectl -n monitoring create secret generic grafana-admin \
  --from-literal=admin-user=admin --from-literal=admin-password='<välj-ett-lösenord>'

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring -f deploy/monitoring/kube-prometheus-stack-values.yaml
helm upgrade --install loki grafana/loki -n monitoring -f deploy/monitoring/loki-values.yaml
helm upgrade --install alloy grafana/alloy -n monitoring -f deploy/monitoring/alloy-values.yaml
```

Dashboarden ligger i koden och laddas in i Grafana automatiskt (sidecar läser ConfigMaps med labeln `grafana_dashboard`):

```bash
kubectl apply -f deploy/monitoring/grafana-dashboard.yaml
```

Den heter **EventPlan – översikt** och visar requests/sekund, svarstid (p50/p95/p99), felandel (5xx), antal
backend-pods (HPA) och backend-loggar från Loki.

Grafana nås via port-forward (`kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80`)
eller via en egen ingress om du vill.

## 5. GitHub: hemligheter och variabler

Under repot → Settings → Secrets and variables → Actions, och under environment `production`:

| Typ | Namn | Värde |
|---|---|---|
| Variable | `DOMAIN` | `example.se` (din domän, utan `api.`) |
| Variable | `S3_BUCKET` | namnet på backup-bucket |
| Variable | `AWS_REGION` | t.ex. `eu-north-1` |
| Secret | `KUBECONFIG_B64` | kubeconfig från VPS:en, base64 (se nedan) |
| Secret | `DB_PASSWORD` | lösenord till Postgres (bara a-z, A-Z, 0-9) |
| Secret | `S3_ACCESS_KEY_ID` | åtkomstnyckel för backup-bucket |
| Secret | `S3_SECRET_ACCESS_KEY` | hemlig nyckel för backup-bucket |
| Secret | `JWT_SECRET` | slumpad hemlighet, minst 32 tecken (`openssl rand -base64 48`) |
| Secret | `ADMIN_EMAIL` | e-post till admin-kontot som skapas vid deploy |
| Secret | `ADMIN_PASSWORD` | lösenord till admin-kontot, minst 8 tecken |

Kubeconfig: kopiera `/etc/rancher/k3s/k3s.yaml` från VPS:en, byt `server: https://127.0.0.1:6443`
till `https://<VPS-IP>:6443`, och koda sedan:

```bash
base64 -w0 k3s.yaml   # macOS: base64 -i k3s.yaml | tr -d '\n'
```

Port 6443 måste vara öppen mot GitHub Actions (eller använd en VPN om du vill låsa ner den).

> **GHCR-images måste vara publika.** Klustret har ingen pull-secret, så om paketen är privata får pods
> `ImagePullBackOff` och deployen hänger. Efter första körningen av pipelinen: GitHub → din profil/organisation →
> Packages → `eventplan-backend` och `eventplan-frontend` → Package settings → Change visibility → Public.
> (Vill du hålla dem privata måste du skapa en `imagePullSecret` i namespace `eventplan` och referera till den i
> `backend.yaml`, `frontend.yaml` och `migrate-job.yaml`.)

## 6. Driftsätt

Det sker automatiskt vid merge till `main` (`.github/workflows/ci-cd.yml`). Manuellt, från en
terminal där `kubectl` pekar på klustret:

```bash
export BACKEND_IMAGE=ghcr.io/<owner>/eventplan-backend:<tag>
export FRONTEND_IMAGE=ghcr.io/<owner>/eventplan-frontend:<tag>
export DOMAIN=example.se S3_BUCKET=... RELEASE=<tag> AWS_REGION=eu-north-1
export DB_PASSWORD=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=...
./deploy/deploy.sh
```

Skriptet gör i ordning: hemligheter → Postgres → migreringar (Job) → backend, frontend, ingress, backup.

### Varför deploy utan downtime

- `RollingUpdate` med `maxUnavailable: 0`: en ny pod startar och måste passera `/ready` (databasen går att nå)
  innan en gammal pod stängs ned.
- `preStop: sleep 5` ger load balancern tid att sluta skicka trafik till en pod som ska stängas.
- Backend hanterar SIGTERM: den slutför pågående requests (`app.close()`) innan den stänger databaspoolen.
- Migreringar körs före rollout. Ändringar ska därför vara bakåtkompatibla (lägg till kolumner, ta bort först i
  nästa release).

Så här testade vi det lokalt (k3d, 900 anrop under `kubectl rollout restart`): 900 av 900 lyckades.

## 7. Autoscaling

HPA skalar `backend` mellan 2 och 6 pods vid 60 % CPU. Visa under försvaret:

```bash
kubectl -n eventplan get hpa -w
BASE_URL=https://api.<domän> k6 run deploy/loadtest/load.js
```

Lokalt testades det: 2 → 6 pods under last, och tillbaka när lasten släpper.

## 8. Backup

`db-backup` körs varje natt 03:00 (Europe/Stockholm). Den gör `pg_dump`, gzippar och laddar upp till
`s3://<S3_BUCKET>/backups/`. Kör manuellt:

```bash
kubectl -n eventplan create job --from=cronjob/db-backup backup-manuell
kubectl -n eventplan logs job/backup-manuell
```

Återställning: ladda ned en fil, packa upp och kör mot databasen:

```bash
aws s3 cp s3://<bucket>/backups/<fil>.sql.gz - | gunzip | kubectl -n eventplan exec -i postgres-0 -- psql -U eventapp -d eventapp
```

## 9. Felsökning och rollback

```bash
kubectl -n eventplan get pods
kubectl -n eventplan logs deploy/backend
kubectl -n eventplan rollout undo deploy/backend     # gå tillbaka till föregående version
```

Loggar finns också i Grafana (datakälla Loki): `{namespace="eventplan", app="backend"}`.
Metrics: `http_requests_total`, `http_request_duration_seconds` och standardmetrik från Node.
