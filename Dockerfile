FROM node:20-alpine
RUN echo 'nameserver 8.8.8.8' > /etc/resolv.conf
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE $PORT
CMD ["sh", "-c", "npm run start"]
