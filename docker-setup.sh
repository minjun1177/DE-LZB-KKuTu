#!/bin/bash
#
# docker-setup.sh — manage the dockerized KKuTu stack.
# See docs/DOCKER.md for details.
#
# Usage: ./docker-setup.sh [up|down|reset|logs|status|restart-web|help]
#
set -euo pipefail

# Always run from the repo root (this script's directory).
cd "$(dirname "$0")"

COMPOSE="docker compose"
URL="http://localhost/"
HEALTH_TIMEOUT=360   # seconds; covers the db healthcheck start_period (300s)

usage() {
    cat <<EOF
KKuTu docker helper — wraps 'docker compose' for the KKuTu stack.

Usage: ./docker-setup.sh <command>

Commands:
  up           Build the image, start all services, wait until healthy, print the URL
  down         Stop the stack (keeps the database volume)
  reset        Stop the stack AND wipe the database (re-imports db.sql next 'up')
  logs         Tail the web + game logs (Ctrl-C to stop)
  status       Show service status / health
  restart-web  Restart only the web service (needed if game restarted)
  help         Show this help

If no command is given, 'up' is assumed.
EOF
}

# Verify docker + Compose v2 are available.
check_prereqs() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "ERROR: 'docker' not found. Install Docker Engine + Compose v2." >&2
        exit 1
    fi
    if ! $COMPOSE version >/dev/null 2>&1; then
        echo "ERROR: 'docker compose' (Compose v2) not available." >&2
        echo "       Install the Docker Compose v2 plugin." >&2
        exit 1
    fi
}

# Warn (non-fatal) if the DB password is out of sync between the two files.
check_password_sync() {
    local compose_pw global_pw
    compose_pw=$(grep -oE 'POSTGRES_PASSWORD:[[:space:]]*[^[:space:]]+' docker-compose.yml 2>/dev/null | head -1 | sed -E 's/.*:[[:space:]]*//') || true
    global_pw=$(grep -oE '"PG_PASSWORD":[[:space:]]*"[^"]*"' deploy/global.docker.json 2>/dev/null | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/') || true
    if [ -n "${compose_pw:-}" ] && [ -n "${global_pw:-}" ] && [ "$compose_pw" != "$global_pw" ]; then
        echo "WARNING: DB password mismatch —" >&2
        echo "  docker-compose.yml POSTGRES_PASSWORD='$compose_pw'" >&2
        echo "  deploy/global.docker.json PG_PASSWORD='$global_pw'" >&2
        echo "  The app will fail to connect until these match. Continuing anyway..." >&2
    fi
}

# Poll 'docker compose ps' until the web service is healthy, or time out.
wait_for_health() {
    echo "Waiting for services to become healthy (up to ${HEALTH_TIMEOUT}s; first boot imports db.sql)..."
    local waited=0
    while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
        # A healthy 'web' implies db, redis and game are healthy (dependency chain).
        if $COMPOSE ps 2>/dev/null | grep -E '^\s*.*web' | grep -q 'healthy'; then
            echo
            echo "✔ all services healthy"
            return 0
        fi
        printf '.'
        sleep 5
        waited=$((waited + 5))
    done
    echo
    echo "ERROR: services did not become healthy within ${HEALTH_TIMEOUT}s." >&2
    echo "       Inspect with: $COMPOSE logs -f db" >&2
    echo "       Current status:" >&2
    $COMPOSE ps >&2 || true
    exit 1
}

cmd_up() {
    check_prereqs
    check_password_sync
    $COMPOSE up --build -d
    wait_for_health
    echo
    echo "KKuTu is up → $URL"
}

cmd="${1:-up}"
case "$cmd" in
    up)           cmd_up ;;
    down)         check_prereqs; $COMPOSE down ;;
    reset)        check_prereqs; $COMPOSE down -v ;;
    logs)         check_prereqs; $COMPOSE logs -f web game ;;
    status)       check_prereqs; $COMPOSE ps ;;
    restart-web)  check_prereqs; $COMPOSE restart web ;;
    help|-h|--help) usage ;;
    *)            echo "Unknown command: $cmd" >&2; echo >&2; usage; exit 1 ;;
esac
