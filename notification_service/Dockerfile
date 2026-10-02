FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# --- Dev target ---
FROM base AS dev
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]

# --- Build stage for production ---
FROM base AS builder
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || true

# --- Prod target ---
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["npm", "run", "start"]
