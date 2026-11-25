FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
USER node

EXPOSE 3001
CMD ["node", "order-service.js"]
