#!/usr/bin/env bash
# Run once on a fresh Ubuntu server (1 GB RAM / 25 GB disk).
# Usage: sudo bash scripts/server-setup.sh
set -euo pipefail

# ── 1. Swap (2 GB) ────────────────────────────────────────────────────────────
# With only 1 GB RAM, a swap file is mandatory so Docker image loading and
# container restarts don't OOM-kill running services.
setup_swap() {
  if swapon --show | grep -q '/swapfile'; then
    echo "[swap] /swapfile already active — skipping"
    return
  fi

  echo "[swap] Creating 2 GB swapfile..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  # Persist across reboots
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi

  # Keep swap as a last resort — prefer real RAM
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf

  echo "[swap] Done. Active swap:"
  swapon --show
}

# ── 2. System dependencies ────────────────────────────────────────────────────
install_deps() {
  echo "[deps] Updating packages..."
  apt-get update -qq
  apt-get install -y --no-install-recommends \
    ca-certificates curl git htop ufw

  # Docker (official repo)
  if ! command -v docker &>/dev/null; then
    echo "[deps] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
  else
    echo "[deps] Docker already installed: $(docker --version)"
  fi
}

# ── 3. Firewall ───────────────────────────────────────────────────────────────
configure_firewall() {
  echo "[ufw] Configuring firewall..."
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
  echo "[ufw] Status:"
  ufw status
}

# ── 4. Deploy directory ───────────────────────────────────────────────────────
# The DEPLOY_PATH secret in GitHub Actions should match this path.
setup_deploy_dir() {
  local DEPLOY_DIR="${1:-/opt/trendbuy}"
  echo "[deploy] Setting up $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR/releases"
  chown -R "$SUDO_USER:$SUDO_USER" "$DEPLOY_DIR" 2>/dev/null || true
  echo "[deploy] Directory ready."
  echo ""
  echo "  Next steps:"
  echo "  1. cd $DEPLOY_DIR"
  echo "  2. git clone <your-repo-url> ."
  echo "  3. cp apps/api/.env.example .env  # then fill in real values"
  echo "  4. Add the following GitHub Actions secrets:"
  echo "       SSH_HOST       — server IP or hostname"
  echo "       SSH_USER       — deploy user (e.g. root or ubuntu)"
  echo "       SSH_PRIVATE_KEY — private key for SSH access"
  echo "       SSH_PORT       — SSH port (default 22)"
  echo "       DEPLOY_PATH    — $DEPLOY_DIR"
}

# ── 5. .env template ──────────────────────────────────────────────────────────
print_env_template() {
  cat <<'EOF'

────────────────────────────────────────────────────────────
Create /opt/trendbuy/.env with these values:
────────────────────────────────────────────────────────────
POSTGRES_USER=trendbuy
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=trendastana
────────────────────────────────────────────────────────────
EOF
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo "=== Trendbuy server setup ==="
echo "RAM: $(free -h | awk '/^Mem/{print $2}')  Disk: $(df -h / | awk 'NR==2{print $4}') free"
echo ""

setup_swap
install_deps
configure_firewall
setup_deploy_dir "/opt/trendbuy"
print_env_template

echo ""
echo "=== Setup complete ==="
