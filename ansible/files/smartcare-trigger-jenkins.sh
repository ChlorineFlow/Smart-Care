#!/usr/bin/env bash
set -Eeuo pipefail

COMMIT_SHA="${1:-}"
if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Expected a full 40-character commit SHA." >&2
  exit 2
fi

CONFIG_FILE="${SMARTCARE_JENKINS_CONFIG:-/etc/smartcare/jenkins-trigger.env}"
if [[ ! -r "$CONFIG_FILE" ]]; then
  echo "Missing Jenkins trigger configuration: $CONFIG_FILE" >&2
  exit 1
fi

source "$CONFIG_FILE"
: "${JENKINS_USER:?Set JENKINS_USER in the root-only configuration file}"
: "${JENKINS_API_TOKEN:?Set JENKINS_API_TOKEN in the root-only configuration file}"
JENKINS_URL="${JENKINS_URL:-http://127.0.0.1:8080}"
JENKINS_URL="${JENKINS_URL%/}"
JENKINS_JOB="${JENKINS_JOB:-SmartCare-CD}"

for command in curl jq awk; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done

jenkins_curl() {
  curl --config <(printf 'user = "%s:%s"\n' "$JENKINS_USER" "$JENKINS_API_TOKEN") "$@"
}

local_jenkins_url() {
  local path="$1"
  case "$path" in
    http://*|https://*)
      path="${path#*://}"
      path="/${path#*/}"
      ;;
    /*) ;;
    *) path="/$path" ;;
  esac
  printf '%s%s' "$JENKINS_URL" "$path"
}

for attempt in $(seq 1 60); do
  if curl --fail --silent --output /dev/null "$JENKINS_URL/login"; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    echo "Jenkins did not become ready at $JENKINS_URL." >&2
    exit 1
  fi
  sleep 5
done

HEADERS_FILE="$(mktemp)"
trap 'rm -f "$HEADERS_FILE"' EXIT
jenkins_curl --fail --silent --show-error \
  --dump-header "$HEADERS_FILE" \
  --output /dev/null \
  --request POST \
  --data-urlencode "COMMIT_SHA=$COMMIT_SHA" \
  "$JENKINS_URL/job/$JENKINS_JOB/buildWithParameters"

QUEUE_URL="$(awk '/^[Ll]ocation:/ { sub(/\r$/, "", $2); print $2; exit }' "$HEADERS_FILE")"
if [[ -z "$QUEUE_URL" ]]; then
  echo "Jenkins accepted no queue location for commit $COMMIT_SHA." >&2
  exit 1
fi
QUEUE_URL="$(local_jenkins_url "$QUEUE_URL")"

BUILD_URL=""
for attempt in $(seq 1 120); do
  QUEUE_JSON="$(jenkins_curl --fail --silent --show-error "${QUEUE_URL%/}/api/json")"
  if [[ "$(jq -r '.cancelled // false' <<<"$QUEUE_JSON")" == true ]]; then
    echo "Jenkins cancelled the queued build for $COMMIT_SHA." >&2
    jq -r '.why // "No reason provided"' <<<"$QUEUE_JSON" >&2
    exit 1
  fi
  BUILD_URL="$(jq -r '.executable.url // empty' <<<"$QUEUE_JSON")"
  [[ -n "$BUILD_URL" ]] && BUILD_URL="$(local_jenkins_url "$BUILD_URL")"
  [[ -n "$BUILD_URL" ]] && break
  sleep 5
done

if [[ -z "$BUILD_URL" ]]; then
  echo "Jenkins did not start a build for $COMMIT_SHA before the queue timeout." >&2
  exit 1
fi

for attempt in $(seq 1 540); do
  BUILD_JSON="$(jenkins_curl --fail --silent --show-error "${BUILD_URL%/}/api/json")"
  if [[ "$(jq -r '.building' <<<"$BUILD_JSON")" == false ]]; then
    RESULT="$(jq -r '.result // "UNKNOWN"' <<<"$BUILD_JSON")"
    if [[ "$RESULT" != SUCCESS ]]; then
      echo "Jenkins build failed for $COMMIT_SHA: $RESULT ($BUILD_URL)" >&2
      exit 1
    fi
    echo "Jenkins build succeeded for $COMMIT_SHA ($BUILD_URL)."
    exit 0
  fi
  sleep 5
done

echo "Jenkins build did not finish within 30 minutes: $BUILD_URL" >&2
exit 1
