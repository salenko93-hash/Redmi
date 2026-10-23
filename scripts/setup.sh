#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then cp .env.example .env; fi
npm ci
npm run db:generate
docker compose up -d db
for attempt in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U fizlab > /dev/null 2>&1; then break; fi
  if [ "$attempt" = 30 ]; then echo 'PostgreSQL did not become ready.' >&2; exit 1; fi
  sleep 1
done
npm run db:migrate
npm run db:seed -- "$@"
echo 'ФізЛаб підготовлено. Запустіть npm run dev або npm run build && npm start.'
