# PROD — Деплой trendbuy.kz

**Стек:** NestJS (API) + Next.js (Web) + PostgreSQL + Docker + Nginx  
**Сервер:** `109.235.119.227`  
**Домен:** `trendbuy.kz`

---

## Оглавление

1. [Подготовка проекта](#1-подготовка-проекта)
2. [Загрузка на GitHub](#2-загрузка-на-github)
3. [Подготовка сервера](#3-подготовка-сервера)
4. [Docker-файлы](#4-docker-файлы)
5. [docker-compose.yml](#5-docker-composeyml)
6. [Nginx конфиг](#6-nginx-конфиг)
7. [Переменные окружения](#7-переменные-окружения)
8. [Первый деплой вручную](#8-первый-деплой-вручную)
9. [GitHub Actions — автодеплой](#9-github-actions--автодеплой)
10. [SSL сертификат](#10-ssl-сертификат)
11. [Рабочий процесс (ветки)](#11-рабочий-процесс-ветки)

---

## 1. Подготовка проекта

### 1.1 Создать `.gitignore` в корне проекта

```
node_modules/
dist/
.env
.env.*
!.env.example
apps/api/uploads/
*.log
.DS_Store
.next/
```

### 1.2 Создать `.env.example` для каждого приложения

**`apps/api/.env.example`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=trendastana
DB_SYNC=true
PORT=4000
NODE_ENV=development
```

**`apps/web/.env.example`:**
```env
NEXT_PUBLIC_API_URL=https://trendbuy.kz/api
```

---

## 2. Загрузка на GitHub

### 2.1 Инициализация репозитория

```bash
# В корне проекта (trendastana/)
git init
git add .
git commit -m "feat: initial commit"
```

### 2.2 Создать репозиторий на GitHub

1. Зайти на [github.com](https://github.com) → **New repository**
2. Название: `trendastana`
3. Visibility: **Private** (рекомендуется)
4. **Не** инициализировать README, .gitignore, license

### 2.3 Привязать и загрузить

```bash
git remote add origin https://github.com/YOUR_USERNAME/trendastana.git
git branch -M main
git push -u origin main
```

### 2.4 Создать ветку develop

```bash
git checkout -b develop
git push -u origin develop
```

### 2.5 Настроить защиту ветки main

GitHub → Settings → Branches → Add branch ruleset:
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (добавить после настройки Actions)

---

## 3. Подготовка сервера

### 3.1 Подключиться по SSH

```bash
ssh root@109.235.119.227
```

### 3.2 Обновить систему и установить зависимости

```bash
apt update && apt upgrade -y
apt install -y curl git ufw
```

### 3.3 Установить Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### 3.4 Установить Docker Compose

```bash
apt install -y docker-compose-plugin
# Проверка:
docker compose version
```

### 3.5 Настроить файрвол

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 3.6 Создать пользователя для деплоя

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh
```

### 3.7 Создать директорию проекта

```bash
mkdir -p /opt/trendastana
chown deploy:deploy /opt/trendastana
```

---

## 4. Docker-файлы

Создать следующие файлы в репозитории:

> **Проверить перед деплоем:** в `apps/api/src/main.ts` порт должен читаться из env:  
> `const port = Number(process.env.PORT || 4000); await app.listen(port)`  
> Если там стоит хардкод — заменить.

### `apps/api/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/migrations ./migrations
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### `apps/web/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### `.dockerignore` (создать в `apps/api/` и `apps/web/`)

```
node_modules/
dist/
.next/
.env
*.log
```

---

## 5. docker-compose.yml

Создать в корне проекта `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: trendastana_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: trendastana_api
    restart: always
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      DB_SYNC: "true" # first deploy: true, after successful import switch to false
      PORT: 3001
      NODE_ENV: production
    depends_on:
      - postgres
    networks:
      - internal
      - external
    volumes:
      - uploads_data:/app/uploads

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://trendbuy.kz/api
    container_name: trendastana_web
    restart: always
    environment:
      NODE_ENV: production
    networks:
      - external

  nginx:
    image: nginx:alpine
    container_name: trendastana_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot_www:/var/www/certbot:ro
      - certbot_certs:/etc/letsencrypt:ro
    depends_on:
      - api
      - web
    networks:
      - external

  certbot:
    image: certbot/certbot
    container_name: trendastana_certbot
    volumes:
      - certbot_www:/var/www/certbot
      - certbot_certs:/etc/letsencrypt

volumes:
  postgres_data:
  uploads_data:
  certbot_www:
  certbot_certs:

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

---

## 6. Nginx конфиг

> Важно: использовать только один nginx на портах `80/443` — либо системный (`systemctl`), либо docker-сервис `nginx` из `docker compose`.

### `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    include /etc/nginx/conf.d/*.conf;
}
```

### `nginx/conf.d/default.conf`

Этот файл живёт в репозитории постоянно. До получения SSL он обслуживает certbot challenge, после — перенаправляет HTTP→HTTPS:

```nginx
server {
    listen 80;
    server_name trendbuy.kz www.trendbuy.kz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

### `nginx/conf.d/trendbuy.conf.disabled` (HTTPS — переименовать после получения сертификата)

> **Важно:** файл хранится в репозитории с расширением `.disabled` — nginx его игнорирует.  
> После получения SSL (шаг 10) переименовать на сервере в `trendbuy.conf`.

```nginx
server {
    listen 443 ssl;
    server_name trendbuy.kz www.trendbuy.kz;

    ssl_certificate /etc/letsencrypt/live/trendbuy.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trendbuy.kz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # NestJS API
    location /api/ {
        proxy_pass http://api:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Загруженные файлы (uploads)
    location /uploads/ {
        proxy_pass http://api:3001/uploads/;
        proxy_set_header Host $host;
    }

    # Next.js frontend
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 7. Переменные окружения

На сервере создать файл `/opt/trendastana/.env` **вручную** (не через git):

```bash
ssh root@109.235.119.227
cat > /opt/trendastana/.env << 'EOF'
POSTGRES_USER=trendastana
POSTGRES_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_СЮДА
POSTGRES_DB=trendastana
EOF
chmod 600 /opt/trendastana/.env
```

> **Важно:** этот файл никогда не попадает в git.

---

## 8. Первый деплой вручную

### 8.1 Клонировать проект на сервер

```bash
ssh deploy@109.235.119.227
cd /opt/trendastana
git clone https://github.com/YOUR_USERNAME/trendastana.git .
```

> Если репозиторий приватный — сначала настроить deploy key (см. шаг 9.1).

### 8.2 Убедиться, что `.env` на месте

Файл `.env` был создан в шаге 7 прямо в `/opt/trendastana/`, а проект также склонирован туда — он уже рядом с `docker-compose.yml`. Проверить:

```bash
ls /opt/trendastana/.env   # должен существовать
```

### 8.3 Поднять контейнеры

```bash
cd /opt/trendastana
docker compose up -d --build
```

### 8.4 Проверить статус

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

### 8.5 Запустить миграции БД

```bash
docker compose run --rm \
  -v /opt/trendastana/apps/api/scripts:/app/scripts:ro \
  -v /opt/trendastana/apps/api/migrations:/app/migrations:ro \
  -v /opt/trendastana/apps/web/public:/apps/web/public:ro \
  api npm run migration:import:full
```

После первого успешного импорта переключить `DB_SYNC` в `docker-compose.yml` на `"false"` и пересоздать `api`:

```bash
docker compose up -d --build api
```

---

## 9. GitHub Actions — автодеплой

> На текущий момент автодеплой заработает только после добавления файла `.github/workflows/deploy.yml` в репозиторий и настройки Secrets.

### 9.1 Создать SSH Deploy Key

На сервере под пользователем `deploy`:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /home/deploy/.ssh/github_deploy -N ""
cat /home/deploy/.ssh/github_deploy.pub >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# Скопировать этот вывод — это приватный ключ для GitHub Secret:
cat /home/deploy/.ssh/github_deploy
```

### 9.2 Добавить секреты в GitHub

GitHub → репозиторий → Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Значение |
|---|---|
| `SSH_PRIVATE_KEY` | содержимое `/home/deploy/.ssh/github_deploy` |
| `SSH_HOST` | `109.235.119.227` |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | `22` |

### 9.3 Создать workflow

Создать файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd /opt/trendastana
            git pull origin main
            docker compose up -d --build --remove-orphans
            docker compose run --rm \
              -v /opt/trendastana/apps/api/scripts:/app/scripts:ro \
              -v /opt/trendastana/apps/api/migrations:/app/migrations:ro \
              -v /opt/trendastana/apps/web/public:/apps/web/public:ro \
              api npm run migration:import:full || true
            docker image prune -f
            echo "Deploy done: $(date)"
```

### 9.4 Закоммитить и запушить

```bash
git add .github/
git commit -m "ci: add production deploy workflow"
git push origin main
```

После этого каждый merge в `main` будет автоматически деплоить сайт.

---

## 10. SSL сертификат

### 10.1 Убедиться, что DNS настроен

DNS A-запись `trendbuy.kz` → `109.235.119.227`  
DNS A-запись `www.trendbuy.kz` → `109.235.119.227`

Проверка:
```bash
nslookup trendbuy.kz
```

### 10.2 Запустить nginx (только HTTP, certbot challenge)

На сервере убедиться, что в `nginx/conf.d/` пока только `default.conf` без HTTPS блока:

```bash
cd /opt/trendastana
docker compose up -d nginx
```

### 10.3 Получить сертификат

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@trendbuy.kz \
  --agree-tos \
  --no-eff-email \
  -d trendbuy.kz \
  -d www.trendbuy.kz
```

### 10.4 Включить HTTPS

Переименовать файл на сервере из `.disabled` в рабочий `.conf` и перезапустить nginx:

```bash
cd /opt/trendastana
mv nginx/conf.d/trendbuy.conf.disabled nginx/conf.d/trendbuy.conf
docker compose restart nginx
```

### 10.5 Автообновление сертификата (cron)

На сервере:
```bash
crontab -e
# Добавить строку:
0 3 * * * cd /opt/trendastana && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

---

## 11. Рабочий процесс (ветки)

```
develop  ──►  feature/fix-name  ──►  PR в develop  ──►  ревью + тест
                                                               │
                                                    PR: develop → main
                                                               │
                                                   GitHub Actions запускает деплой
                                                               │
                                                    Сайт обновился на trendbuy.kz
```

### Ежедневная разработка

```bash
# 1. Синхронизироваться с develop
git checkout develop
git pull origin develop

# 2. Создать ветку под задачу
git checkout -b feature/my-feature

# 3. Коммитить изменения
git add .
git commit -m "feat: описание изменения"
git push origin feature/my-feature

# 4. На GitHub: создать PR  feature/my-feature → develop
#    После ревью — merge в develop

# 5. Когда набор фич готов к релизу — создать PR: develop → main
#    После merge — автодеплой запустится автоматически
```

### Статус деплоя

GitHub → Actions → последний workflow → логи

### Откат на предыдущую версию

```bash
ssh deploy@109.235.119.227
cd /opt/trendastana
git log --oneline -10                      # найти нужный коммит
git revert HEAD --no-edit                  # создать revert-коммит
# или откатить несколько коммитов:
git revert HEAD~3..HEAD --no-edit
git push origin main                       # триггернуть автодеплой через Actions
```

> **Не используй** `git checkout <hash>` — это переводит репо в detached HEAD и ломает последующие `git pull` в GitHub Actions.

---

## Быстрые команды на сервере

```bash
# Статус всех контейнеров
docker compose ps

# Логи в реальном времени
docker compose logs -f

# Логи одного сервиса
docker compose logs -f api
docker compose logs -f web

# Перезапустить один сервис
docker compose restart api

# Зайти внутрь контейнера
docker compose exec api sh

# Размер образов и томов
docker system df

# Очистить неиспользуемые образы
docker image prune -f
```

### Alias for one-command deploy (`td-deploy`)

Run once on server (user `deploy`):

```bash
cat >> ~/.bashrc << 'EOF'
alias td-deploy='cd /opt/trendastana && git pull origin main && COMPOSE_FILE=docker-compose.release.yml IMAGE_TAG=latest DOCKER_IMAGE_PREFIX=trendastana bash scripts/deploy-release.sh'
alias td-deploy-prune='cd /opt/trendastana && git pull origin main && COMPOSE_FILE=docker-compose.release.yml IMAGE_TAG=latest DOCKER_IMAGE_PREFIX=trendastana PRUNE_PROJECT_IMAGES=1 bash scripts/deploy-release.sh'
EOF
source ~/.bashrc
```

Usage:

```bash
td-deploy
# or, with extra cleanup of old trendastana/* images:
td-deploy-prune
```
