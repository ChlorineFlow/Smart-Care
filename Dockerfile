FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server/ ./server/
COPY .env.example .env

EXPOSE 4000

CMD ["node", "server/index.js"]