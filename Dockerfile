FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── DNS fix: NODE_OPTIONS ensures --dns-result-order=ipv4first is set for every
# Node.js process started from this image, including next start.
# The undici setGlobalDispatcher in instrumentation.ts handles fetch() DNS;
# this flag covers any other dns.lookup() calls.
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# ── Runtime DNS patch ──────────────────────────────────────────────────────────
# su-exec is the Alpine equivalent of gosu — a tiny setuid helper that lets us
# start the container as root (to patch /etc/resolv.conf), then exec as appuser.
RUN apk add --no-cache su-exec

# Run as a non-root user — never run production containers as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

# Copy the entrypoint script and make it executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# ── DNS note ──────────────────────────────────────────────────────────────────
# Alpine uses musl libc whose DNS resolver reads /etc/resolv.conf. Docker
# overwrites /etc/resolv.conf at container start-up with its own generated
# version pointing at the internal resolver (127.0.0.11), so any changes
# made here at build time have no effect at runtime.
#
# The docker-entrypoint.sh script runs as root at container start, appends
# public DNS servers (8.8.8.8 / 8.8.4.4 / 1.1.1.1) to /etc/resolv.conf,
# then uses su-exec to drop privileges to appuser before exec'ing the app.
#
# Additionally, instrumentation.ts uses undici setGlobalDispatcher to route
# all fetch() calls through a custom dns.Resolver that uses public DNS directly
# (bypassing musl getaddrinfo entirely).
# ──────────────────────────────────────────────────────────────────────────────

EXPOSE $PORT

# Start as root so entrypoint can patch /etc/resolv.conf, then su-exec to appuser
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
