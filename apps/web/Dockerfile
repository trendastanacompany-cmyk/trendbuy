FROM node:20-alpine AS builder
WORKDIR /app

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Locate the real Next standalone entrypoint (exclude node_modules internals)
RUN ENTRY=$(find /app/.next/standalone -type f -name "server.js" ! -path "*/node_modules/*" | sort | head -1) && \
    test -n "$ENTRY" && \
    echo "Found standalone entry: $ENTRY" && \
    echo "$ENTRY" > /app/.next/standalone/.entrypoint

# ─── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone bundle (includes node_modules needed at runtime)
COPY --from=builder /app/.next/standalone ./

# Read the entrypoint path determined at build time
COPY --from=builder /app/.next/standalone/.entrypoint ./.entrypoint

# Static assets must sit next to the server.js that serves them
RUN ENTRY=$(cat /app/.entrypoint) && \
    ENTRY_DIR=$(dirname "$ENTRY") && \
    echo "Entry directory: $ENTRY_DIR"

COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Place static/public next to server.js as well (handles monorepo path variants)
RUN ENTRY_DIR=$(dirname "$(cat /app/.entrypoint)") && \
    if [ "$ENTRY_DIR" != "/app" ]; then \
      cp -r /app/.next/static "$ENTRY_DIR/.next/static" 2>/dev/null || true; \
      cp -r /app/public "$ENTRY_DIR/public" 2>/dev/null || true; \
    fi

EXPOSE 3000

CMD ["sh", "-c", "exec node $(cat /app/.entrypoint)"]
