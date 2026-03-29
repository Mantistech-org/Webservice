FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run as a non-root user — never run production containers as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

# ── DNS note ──────────────────────────────────────────────────────────────
# Alpine uses musl libc whose DNS resolver reads /etc/resolv.conf. Docker
# overwrites /etc/resolv.conf at container start-up with its own generated
# version pointing at the internal resolver (127.0.0.11), so any changes
# made here at build time have no effect at runtime.
#
# The DNS reliability fix (previously a resolv.conf RUN step) has been moved
# into lib/supabase.ts which runs at Node.js startup and appends 8.8.8.8 /
# 8.8.4.4 / 1.1.1.1 to the server list via dns.setServers(). This works
# without root access and survives the container DNS overwrite.
# ──────────────────────────────────────────────────────────────────────────

USER appuser
EXPOSE $PORT
CMD ["npm", "run", "start"]
