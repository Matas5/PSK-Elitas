#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

docker compose up -d postgres

trap "kill 0" EXIT
( cd backend && ./mvnw -Dmaven.test.skip=true spring-boot:run ) &
( cd auth-server && npm run dev ) &
( cd frontend && npm run dev -- --host 127.0.0.1 ) &
wait
