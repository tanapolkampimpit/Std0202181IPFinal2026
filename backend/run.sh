#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

command -v node >/dev/null 2>&1 || { echo "Node.js 22.13+ is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required." >&2; exit 1; }
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<13)){console.error("Node.js 22.13+ is required.");process.exit(1)}'

if [[ ! -f .env ]]; then
  umask 077
  cp .env.example .env
  node --input-type=module -e 'import fs from "node:fs"; import {randomBytes} from "node:crypto"; fs.writeFileSync(".env",fs.readFileSync(".env","utf8").replace(/^JWT_SECRET=.*$/m,"JWT_SECRET="+randomBytes(48).toString("hex")))'
  echo "Created private .env. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and APP_PORT, then run bash run.sh again."
  exit 1
fi

# Never source .env as shell code; Node parses it as configuration.
npm ci --omit=dev --no-audit --no-fund
case "${1:-start}" in
  start) exec node --env-file=.env src/server.js ;;
  check) exec node --env-file=.env scripts/check-db.js ;;
  create-admin)
    export ADMIN_USERNAME="${2:-admin}"
    read -r -s -p "New admin password (8+ characters): " ADMIN_PASSWORD
    printf '\n'
    read -r -s -p "Confirm password: " password_confirmation
    printf '\n'
    [[ "$ADMIN_PASSWORD" == "$password_confirmation" ]] || { echo "Passwords do not match." >&2; exit 1; }
    export ADMIN_PASSWORD
    exec node --env-file=.env scripts/create-admin.js
    ;;
  *) echo "Usage: bash run.sh [start|check|create-admin [username]]" >&2; exit 2 ;;
esac
