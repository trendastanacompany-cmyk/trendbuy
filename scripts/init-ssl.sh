#!/usr/bin/env bash
# Run ONCE on a fresh server to obtain the first SSL certificate.
# After this script completes, normal deploys via GitHub Actions work automatically.
#
# Usage: cd /opt/trendbuy && bash scripts/init-ssl.sh
set -euo pipefail

DOMAIN="trendbuy.kz"
EMAIL="trendastanacompany@gmail.com"
COMPOSE="docker-compose.release.yml"

echo "=== Step 1: Start nginx in HTTP-only mode ==="
# Temporarily replace SSL config with HTTP-only to allow certbot challenge
cat > /tmp/nginx-init.conf << 'EOF'
server {
    listen 80;
    server_name trendbuy.kz www.trendbuy.kz;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 "OK";
    }
}
EOF

cp nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
cp /tmp/nginx-init.conf nginx/conf.d/default.conf

echo "=== Step 2: Start nginx container only ==="
docker compose -f "$COMPOSE" up -d nginx

echo "=== Step 3: Obtain SSL certificate ==="
docker compose -f "$COMPOSE" run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "=== Step 4: Restore HTTPS nginx config ==="
cp nginx/conf.d/default.conf.bak nginx/conf.d/default.conf

echo "=== Step 5: Restart nginx with SSL ==="
docker compose -f "$COMPOSE" restart nginx

echo ""
echo "SSL certificate obtained. Now run a full deploy:"
echo "  git pull origin main"
echo "  docker compose -f $COMPOSE up -d"
