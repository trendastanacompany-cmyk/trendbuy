#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.release.yml}"
DOCKER_IMAGE_PREFIX="${DOCKER_IMAGE_PREFIX:-trendastana}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
RELEASE_ARCHIVE="${RELEASE_ARCHIVE:-}"
SKIP_PULL="${SKIP_PULL:-0}"
PRUNE_PROJECT_IMAGES="${PRUNE_PROJECT_IMAGES:-0}"
CLEAN_RELEASE_ARCHIVE="${CLEAN_RELEASE_ARCHIVE:-0}"
AGGRESSIVE_PRUNE="${AGGRESSIVE_PRUNE:-0}"

echo "==> Docker disk usage (before cleanup)"
docker system df || true

echo "==> Pruning unused Docker resources"
docker container prune -f || true
if [[ "$AGGRESSIVE_PRUNE" == "1" ]]; then
  docker image prune -af || true
  docker volume prune -f || true
else
  docker image prune -f || true
fi
docker builder prune -af || true

echo "==> Docker disk usage (after cleanup)"
docker system df || true

if [[ -n "$RELEASE_ARCHIVE" ]]; then
  if [[ ! -f "$RELEASE_ARCHIVE" ]]; then
    echo "Release archive not found: $RELEASE_ARCHIVE" >&2
    exit 1
  fi
  echo "==> Loading archive: $RELEASE_ARCHIVE"
  docker load -i "$RELEASE_ARCHIVE"
  if [[ "$CLEAN_RELEASE_ARCHIVE" == "1" ]]; then
    echo "==> Removing loaded archive: $RELEASE_ARCHIVE"
    rm -f "$RELEASE_ARCHIVE"
  fi
fi

if [[ "$SKIP_PULL" != "1" ]]; then
  echo "==> Pulling images from registry"
  IMAGE_TAG="$IMAGE_TAG" DOCKER_IMAGE_PREFIX="$DOCKER_IMAGE_PREFIX" docker compose -f "$COMPOSE_FILE" pull
fi

echo "==> Starting services"
IMAGE_TAG="$IMAGE_TAG" DOCKER_IMAGE_PREFIX="$DOCKER_IMAGE_PREFIX" docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker compose -f "$COMPOSE_FILE" ps

if [[ "$PRUNE_PROJECT_IMAGES" == "1" ]]; then
  echo "==> Removing unused project images (${DOCKER_IMAGE_PREFIX}/*)"
  in_use_ids="$(docker compose -f "$COMPOSE_FILE" images -q | sort -u || true)"
  docker images "${DOCKER_IMAGE_PREFIX}/*" --format "{{.Repository}}:{{.Tag}} {{.ID}}" | while read -r ref id; do
    [[ -z "${ref:-}" || -z "${id:-}" ]] && continue
    if [[ "$ref" == "${DOCKER_IMAGE_PREFIX}/api:${IMAGE_TAG}" || "$ref" == "${DOCKER_IMAGE_PREFIX}/web:${IMAGE_TAG}" ]]; then
      continue
    fi
    if ! grep -qx "$id" <<<"$in_use_ids"; then
      docker rmi "$ref" || true
    fi
  done
fi

echo "==> Deploy completed"
