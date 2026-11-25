#!/usr/bin/env bash
# Manage the Cloudflare Tunnel (cloudflared).
# Works with both the systemd service and a manually started process.
#
# Usage: ./bin/tunnel.sh <command>
#   status    show whether cloudflared is running (default)
#   start     start the systemd service
#   stop      stop the service and any manually started cloudflared
#   restart   restart the service (re-copies ~/.cloudflared/config.yml first)
#   logs      follow service logs
#   install   install cloudflared as a systemd service (one-time)
set -uo pipefail

SERVICE=cloudflared
USER_CONFIG="$HOME/.cloudflared/config.yml"
SYSTEM_CONFIG=/etc/cloudflared/config.yml

has_service() { systemctl list-unit-files "$SERVICE.service" --no-legend 2>/dev/null | grep -q .; }
service_active() { systemctl is-active --quiet "$SERVICE"; }
# PIDs of cloudflared NOT started by systemd (e.g. 'cloudflared tunnel run' in a terminal)
manual_pids() {
  local svc_pid
  svc_pid=$(systemctl show -p MainPID --value "$SERVICE" 2>/dev/null || echo 0)
  pgrep -x cloudflared | grep -vx "${svc_pid:-0}" || true
}

# Copy the user config to /etc if they differ (the service reads /etc/cloudflared).
sync_config() {
  if [[ -f "$USER_CONFIG" ]] && ! sudo cmp -s "$USER_CONFIG" "$SYSTEM_CONFIG" 2>/dev/null; then
    echo "==> Syncing $USER_CONFIG → $SYSTEM_CONFIG"
    sudo mkdir -p /etc/cloudflared
    sudo cp "$USER_CONFIG" "$SYSTEM_CONFIG"
  fi
}

cmd_status() {
  echo "== systemd service"
  if ! has_service; then
    echo "  not installed (run: $0 install)"
  elif service_active; then
    echo "  ✅ running (pid $(systemctl show -p MainPID --value $SERVICE), since $(systemctl show -p ActiveEnterTimestamp --value $SERVICE))"
  else
    echo "  ⏹  stopped"
  fi

  echo "== manual processes"
  local pids; pids=$(manual_pids)
  if [[ -n "$pids" ]]; then
    for p in $pids; do echo "  ⚠️  pid $p: $(ps -o args= -p "$p")"; done
    echo "  (stop with: $0 stop)"
  else
    echo "  none"
  fi

  echo "== tunnel connections"
  if service_active || [[ -n "$pids" ]]; then
    # Metrics server reports active edge connections
    local port
    for port in 20241 20242 20243 20244 20245; do
      if out=$(curl -s --max-time 2 "http://127.0.0.1:$port/ready" 2>/dev/null) && [[ -n "$out" ]]; then
        echo "  $out (metrics :$port)"
        break
      fi
    done
  else
    echo "  not connected"
  fi
}

cmd_stop() {
  if has_service && service_active; then
    echo "==> Stopping systemd service"
    sudo systemctl stop "$SERVICE"
  fi
  local pids; pids=$(manual_pids)
  if [[ -n "$pids" ]]; then
    echo "==> Stopping manual cloudflared: $pids"
    kill $pids 2>/dev/null
    sleep 2
    pids=$(manual_pids)
    [[ -n "$pids" ]] && { echo "   still alive, sending SIGKILL"; kill -9 $pids 2>/dev/null; }
  fi
  echo "==> Stopped"
}

cmd_start() {
  has_service || { echo "Service not installed. Run: $0 install" >&2; exit 1; }
  # A manual process would run alongside the service as a duplicate connector
  local pids; pids=$(manual_pids)
  [[ -n "$pids" ]] && { echo "==> Stopping manual cloudflared first: $pids"; kill $pids; sleep 2; }
  sync_config
  sudo systemctl start "$SERVICE"
  sleep 2
  cmd_status
}

cmd_restart() {
  has_service || { echo "Service not installed. Run: $0 install" >&2; exit 1; }
  sync_config
  sudo systemctl restart "$SERVICE"
  sleep 2
  cmd_status
}

cmd_install() {
  if has_service; then
    echo "Service already installed."
  else
    cmd_stop
    # 'sudo cloudflared service install' looks in root's home and /etc/cloudflared,
    # not in ~/.cloudflared — so put the config in /etc first.
    sync_config
    sudo cloudflared service install
  fi
  sync_config
  sudo systemctl enable --now "$SERVICE"
  sleep 2
  cmd_status
}

case "${1:-status}" in
  status)  cmd_status ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  logs)    sudo journalctl -u "$SERVICE" -f -n 50 ;;
  install) cmd_install ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac

