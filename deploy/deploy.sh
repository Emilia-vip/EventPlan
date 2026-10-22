#!/usr/bin/env bash
# Driftsätter EventPlan till klustret som kubectl pekar på (k3s på VPS:en).
# Körs av GitHub Actions på varje merge till main, eller manuellt.
#
# Krävs i miljön:
#   BACKEND_IMAGE, FRONTEND_IMAGE  bild-taggar (t.ex. ghcr.io/<owner>/eventplan-backend:<sha>)
#   DOMAIN                         din domän, t.ex. example.se (api.DOMAIN och cdn.DOMAIN)
#   S3_BUCKET                      bucket för databas-backuper
#   RELEASE                        unik version, t.ex. kort git-sha (används för migrations-Job:et)
#   DB_PASSWORD                    lösenord till Postgres (använd bara a-z, A-Z, 0-9)
#   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, AWS_REGION
#   JWT_SECRET                     hemlighet för inloggnings-token (minst 32 tecken)
#   ADMIN_EMAIL, ADMIN_PASSWORD    admin-kontot som skapas av migrate-jobbet (lösenord minst 8 tecken)
set -euo pipefail

: "${BACKEND_IMAGE:?}" "${FRONTEND_IMAGE:?}" "${DOMAIN:?}" "${S3_BUCKET:?}" "${RELEASE:?}"
: "${DB_PASSWORD:?}" "${S3_ACCESS_KEY_ID:?}" "${S3_SECRET_ACCESS_KEY:?}" "${AWS_REGION:?}"
: "${JWT_SECRET:?}" "${ADMIN_EMAIL:?}" "${ADMIN_PASSWORD:?}"

export BACKEND_IMAGE FRONTEND_IMAGE DOMAIN S3_BUCKET RELEASE
VARS='${BACKEND_IMAGE} ${FRONTEND_IMAGE} ${DOMAIN} ${S3_BUCKET} ${RELEASE}'
K8S_DIR="$(cd "$(dirname "$0")/k8s" && pwd)"
NS=eventplan

# Ersätt bara våra egna variabler i manifesten (envsubst skulle annars röra andra $-tecken)
render() { envsubst "$VARS" < "$K8S_DIR/$1"; }

# Hemligheter skapas från miljön, aldrig från filer i git
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl -n $NS create secret generic eventplan-db \
  --from-literal=POSTGRES_USER=eventapp \
  --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
  --from-literal=POSTGRES_DB=eventapp \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n $NS create secret generic eventplan-backend \
  --from-literal=DATABASE_URL="postgres://eventapp:$DB_PASSWORD@postgres:5432/eventapp" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -
# Admin-uppgifterna behövs bara av migrate-jobbet, så de hålls utanför backend-podarna
kubectl -n $NS create secret generic eventplan-admin \
  --from-literal=ADMIN_EMAIL="$ADMIN_EMAIL" \
  --from-literal=ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n $NS create secret generic eventplan-s3 \
  --from-literal=AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
  --from-literal=AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
  --from-literal=AWS_DEFAULT_REGION="$AWS_REGION" \
  --dry-run=client -o yaml | kubectl apply -f -

# 1. Databasen först, sedan migreringar (innan ny kod rullas ut)
render postgres.yaml | kubectl apply -f -
kubectl -n $NS rollout status statefulset/postgres --timeout=180s
render migrate-job.yaml | kubectl apply -f -
kubectl -n $NS wait --for=condition=complete "job/migrate-$RELEASE" --timeout=300s

# 2. Applikationen. Rolling update med readiness-probes ger deploy utan downtime
render backend.yaml | kubectl apply -f -
render frontend.yaml | kubectl apply -f -
render ingress.yaml | kubectl apply -f -
render backup-cronjob.yaml | kubectl apply -f -
kubectl -n $NS rollout status deploy/backend --timeout=300s
kubectl -n $NS rollout status deploy/frontend --timeout=300s

echo "Driftsatt $RELEASE: https://api.$DOMAIN och https://cdn.$DOMAIN"
