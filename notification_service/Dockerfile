FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# --- Dev target ---
FROM base AS dev
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]

# --- Build stage for production ---
FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Prod target ---
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["npm", "run", "start"]
