#!/bin/bash
# Start both QQBot service and FastAPI backend from repo root

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[run-backend] Starting services from $(pwd)"

# Check required ports before starting
for PORT in 3001 8000; do
    STALE_PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$STALE_PID" ]; then
        echo "[run-backend] Error: port $PORT is already in use (PID: $STALE_PID)"
        echo "[run-backend] Please stop the existing process first, then retry."
        exit 1
    fi
done

# Start QQBot service
node backend/services/qqbot/server.js &
QQBOT_PID=$!
echo "[run-backend] QQBot service started (PID: $QQBOT_PID)"

# Start FastAPI backend with venv python
backend/venv/bin/python backend/run.py &
BACKEND_PID=$!
echo "[run-backend] FastAPI backend started (PID: $BACKEND_PID)"

# Cleanup on exit
cleanup() {
    echo ""
    echo "[run-backend] Shutting down services..."
    kill $QQBOT_PID $BACKEND_PID 2>/dev/null || true
    wait $QQBOT_PID $BACKEND_PID 2>/dev/null || true
    echo "[run-backend] All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait -n $QQBOT_PID $BACKEND_PID
EXIT_CODE=$?

echo "[run-backend] A service exited with code $EXIT_CODE, stopping remaining..."
kill $QQBOT_PID $BACKEND_PID 2>/dev/null || true
wait $QQBOT_PID $BACKEND_PID 2>/dev/null || true
exit $EXIT_CODE
