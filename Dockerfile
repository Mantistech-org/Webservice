FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE $PORT
CMD ["sh", "-c", "echo 'nameserver 8.8.8.8' > /etc/resolv.conf && npm run start"]
