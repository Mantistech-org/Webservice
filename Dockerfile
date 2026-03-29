FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Override DNS at build time (Railway/Docker resolver quirk) so it persists at runtime
RUN echo 'nameserver 8.8.8.8' > /etc/resolv.conf
# Run as a non-root user — never run production containers as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser
EXPOSE $PORT
CMD ["npm", "run", "start"]
