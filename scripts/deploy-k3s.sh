#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
DEPLOY_DIR="${SMARTCARE_DEPLOY_DIR:-/opt/smartcare-deploy}"
APP_ENV_FILE="${SMARTCARE_ENV_FILE:-/etc/smartcare/app.env}"

if [[ ! "$IMAGE_TAG" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Invalid image tag: $IMAGE_TAG" >&2
  exit 2
fi

if [[ ! -f "$APP_ENV_FILE" ]]; then
  echo "Missing $APP_ENV_FILE; create it with the production app environment first." >&2
  exit 1
fi

KUBECTL=(k3s kubectl)
for attempt in $(seq 1 60); do
  if "${KUBECTL[@]}" get nodes >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
"${KUBECTL[@]}" wait --for=condition=Ready nodes --all --timeout=120s

"${KUBECTL[@]}" apply -f "$DEPLOY_DIR/k8s/namespace.yaml"
"${KUBECTL[@]}" create secret generic smartcare-app-env \
  --namespace=smartcare \
  --from-env-file="$APP_ENV_FILE" \
  --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f -

for component in backend frontend; do
  sed "s|:latest$|:${IMAGE_TAG}|" "$DEPLOY_DIR/k8s/${component}.yaml" \
    | "${KUBECTL[@]}" apply --namespace=smartcare -f -
done

"${KUBECTL[@]}" rollout status --namespace=smartcare deployment/smartcare-backend --timeout=180s
"${KUBECTL[@]}" rollout status --namespace=smartcare deployment/smartcare-frontend --timeout=180s

PORT_FORWARD_LOG="$(mktemp)"
"${KUBECTL[@]}" port-forward --namespace=smartcare service/smartcare-backend 127.0.0.1:14000:4000 >"$PORT_FORWARD_LOG" 2>&1 &
PORT_FORWARD_PID=$!
trap 'kill "$PORT_FORWARD_PID" 2>/dev/null || true; rm -f "$PORT_FORWARD_LOG"' EXIT

for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:14000/api/health >/dev/null; then
    echo "SmartCare deployed with image tag $IMAGE_TAG; API health check passed."
    exit 0
  fi
  if ! kill -0 "$PORT_FORWARD_PID" 2>/dev/null; then
    cat "$PORT_FORWARD_LOG" >&2
    exit 1
  fi
  sleep 2
done

cat "$PORT_FORWARD_LOG" >&2
echo "SmartCare API health check timed out." >&2
exit 1