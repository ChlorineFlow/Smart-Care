
#!/usr/bin/env bash
set -Eeuo pipefail

COMMIT_SHA="${1:-}"
K8S_NAMESPACE="${2:-smartcare}"
BACKEND_DEPLOYMENT="${3:-smartcare-backend}"
BACKEND_CONTAINER="${4:-backend}"
BACKEND_SERVICE="${5:-smartcare-backend}"
FRONTEND_DEPLOYMENT="${6:-smartcare-frontend}"
FRONTEND_CONTAINER="${7:-frontend}"
FRONTEND_SERVICE="${8:-smartcare-frontend}"
BACKEND_SERVICE_PORT="${9:-4000}"
FRONTEND_SERVICE_PORT="${10:-80}"
IMAGE_PREFIX="${IMAGE_PREFIX:-ghcr.io/chlorineflow/smart-care}"

if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Expected a full 40-character commit SHA." >&2
  exit 2
fi

for command in kubectl curl; do
  command -v "$command" >/dev/null || {
    echo "Missing required command: $command" >&2
    exit 1
  }
done

get_container_image() {
  kubectl get "deployment/$1" --namespace="$K8S_NAMESPACE" \
    --output="jsonpath={.spec.template.spec.containers[?(@.name==\"$2\")].image}"
}

show_diagnostics() {
  echo "========== Deployment diagnostics ==========" >&2
  kubectl get deployments,pods,replicasets \
    --namespace="$K8S_NAMESPACE" -o wide >&2 || true
  kubectl get events --namespace="$K8S_NAMESPACE" \
    --sort-by=.lastTimestamp >&2 || true
  echo "=============================================" >&2
}

kubectl get "deployment/$BACKEND_DEPLOYMENT" --namespace="$K8S_NAMESPACE" >/dev/null
kubectl get "deployment/$FRONTEND_DEPLOYMENT" --namespace="$K8S_NAMESPACE" >/dev/null
kubectl get "service/$BACKEND_SERVICE" --namespace="$K8S_NAMESPACE" >/dev/null
kubectl get "service/$FRONTEND_SERVICE" --namespace="$K8S_NAMESPACE" >/dev/null

PREVIOUS_BACKEND_IMAGE="$(get_container_image "$BACKEND_DEPLOYMENT" "$BACKEND_CONTAINER")"
PREVIOUS_FRONTEND_IMAGE="$(get_container_image "$FRONTEND_DEPLOYMENT" "$FRONTEND_CONTAINER")"

if [[ -z "$PREVIOUS_BACKEND_IMAGE" || -z "$PREVIOUS_FRONTEND_IMAGE" ]]; then
  echo "Could not find configured containers; no resources were changed." >&2
  exit 1
fi

# These tags must match the tags built and pushed by Jenkinsfile.
NEW_BACKEND_IMAGE="$IMAGE_PREFIX-backend:$COMMIT_SHA"
NEW_FRONTEND_IMAGE="$IMAGE_PREFIX-frontend:$COMMIT_SHA"

DEPLOYMENT_STARTED=0
BACKEND_FORWARD_PID=""
FRONTEND_FORWARD_PID=""
BACKEND_LOG="$(mktemp)"
FRONTEND_LOG="$(mktemp)"
FRONTEND_BODY="$(mktemp)"

cleanup() {
  status=$?
  set +e

  [[ -n "$BACKEND_FORWARD_PID" ]] && kill "$BACKEND_FORWARD_PID" 2>/dev/null
  [[ -n "$FRONTEND_FORWARD_PID" ]] && kill "$FRONTEND_FORWARD_PID" 2>/dev/null

  if [[ $status -ne 0 && $DEPLOYMENT_STARTED -eq 1 ]]; then
    echo "Deployment failed. Collecting diagnostics..." >&2
    show_diagnostics

    echo "Restoring previous container images..." >&2

    kubectl set image "deployment/$BACKEND_DEPLOYMENT" \
      "$BACKEND_CONTAINER=$PREVIOUS_BACKEND_IMAGE" \
      --namespace="$K8S_NAMESPACE" || echo "Backend rollback image update failed." >&2

    kubectl set image "deployment/$FRONTEND_DEPLOYMENT" \
      "$FRONTEND_CONTAINER=$PREVIOUS_FRONTEND_IMAGE" \
      --namespace="$K8S_NAMESPACE" || echo "Frontend rollback image update failed." >&2

    kubectl rollout status "deployment/$BACKEND_DEPLOYMENT" \
      --namespace="$K8S_NAMESPACE" --timeout=240s \
      || echo "WARNING: Backend rollback rollout did not complete." >&2

    kubectl rollout status "deployment/$FRONTEND_DEPLOYMENT" \
      --namespace="$K8S_NAMESPACE" --timeout=240s \
      || echo "WARNING: Frontend rollback rollout did not complete." >&2

    show_diagnostics
  fi

  rm -f "$BACKEND_LOG" "$FRONTEND_LOG" "$FRONTEND_BODY"
  exit "$status"
}

trap cleanup EXIT

DEPLOYMENT_STARTED=1

echo "Deploying backend image: $NEW_BACKEND_IMAGE"
kubectl set image "deployment/$BACKEND_DEPLOYMENT" \
  "$BACKEND_CONTAINER=$NEW_BACKEND_IMAGE" --namespace="$K8S_NAMESPACE"

echo "Deploying frontend image: $NEW_FRONTEND_IMAGE"
kubectl set image "deployment/$FRONTEND_DEPLOYMENT" \
  "$FRONTEND_CONTAINER=$NEW_FRONTEND_IMAGE" --namespace="$K8S_NAMESPACE"

echo "Waiting for backend rollout..."
kubectl rollout status "deployment/$BACKEND_DEPLOYMENT" \
  --namespace="$K8S_NAMESPACE" --timeout=240s \
  || {
    echo "Backend rollout failed." >&2
    show_diagnostics
    exit 1
  }

echo "Waiting for frontend rollout..."
kubectl rollout status "deployment/$FRONTEND_DEPLOYMENT" \
  --namespace="$K8S_NAMESPACE" --timeout=240s \
  || {
    echo "Frontend rollout failed." >&2
    show_diagnostics
    exit 1
  }

kubectl port-forward --address 127.0.0.1 \
  "service/$BACKEND_SERVICE" "14000:$BACKEND_SERVICE_PORT" \
  --namespace="$K8S_NAMESPACE" >"$BACKEND_LOG" 2>&1 &
BACKEND_FORWARD_PID=$!

kubectl port-forward --address 127.0.0.1 \
  "service/$FRONTEND_SERVICE" "18080:$FRONTEND_SERVICE_PORT" \
  --namespace="$K8S_NAMESPACE" >"$FRONTEND_LOG" 2>&1 &
FRONTEND_FORWARD_PID=$!

READY=0

for attempt in $(seq 1 30); do
  if curl --fail --silent --output "$FRONTEND_BODY" \
    http://127.0.0.1:18080/ \
    && curl --fail --silent http://127.0.0.1:14000/api/health >/dev/null; then
    READY=1
    break
  fi

  if ! kill -0 "$BACKEND_FORWARD_PID" 2>/dev/null; then
    cat "$BACKEND_LOG" >&2
    exit 1
  fi

  if ! kill -0 "$FRONTEND_FORWARD_PID" 2>/dev/null; then
    cat "$FRONTEND_LOG" >&2
    exit 1
  fi

  sleep 2
done

if [[ $READY -ne 1 ]]; then
  cat "$BACKEND_LOG" "$FRONTEND_LOG" >&2
  echo "Frontend or backend smoke test timed out." >&2
  exit 1
fi

DEPLOYMENT_STARTED=0

echo "Commit $COMMIT_SHA deployed successfully."
echo "Existing Services and persistent data were not modified."
echo "Frontend and backend API smoke tests passed."
