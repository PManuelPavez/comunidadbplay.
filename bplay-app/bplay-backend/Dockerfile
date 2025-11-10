FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
COPY .env ./.env

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/server.js"]
