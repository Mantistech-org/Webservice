#!/bin/sh
# docker-entrypoint.sh — runs as root, patches /etc/resolv.conf, then drops to appuser.
#
# Why this exists:
#   Docker overwrites /etc/resolv.conf at container start with its own generated
#   version pointing at the internal resolver (127.0.0.11). Alpine uses musl libc
#   which queries ALL nameservers concurrently, so Docker's 127.0.0.11 NXDOMAIN
#   response can arrive before public DNS answers and win. The result is ENOTFOUND
#   even when the hostname is perfectly valid.
#
#   By appending public nameservers here (after Docker has set up the file) we
#   ensure they are present at runtime without needing root later.
set -e

echo "[entrypoint] Patching /etc/resolv.conf with public DNS fallbacks..."
{
  printf '\n# Public DNS fallbacks added by docker-entrypoint.sh\n'
  printf 'nameserver 8.8.8.8\n'
  printf 'nameserver 8.8.4.4\n'
  printf 'nameserver 1.1.1.1\n'
} >> /etc/resolv.conf 2>/dev/null || echo "[entrypoint] WARNING: could not patch /etc/resolv.conf (non-fatal)"

echo "[entrypoint] /etc/resolv.conf:"
cat /etc/resolv.conf || true

echo "[entrypoint] Dropping privileges to appuser..."
exec su-exec appuser "$@"
