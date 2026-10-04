FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# --- Dev target ---
FROM base AS dev
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --- Build stage for production ---
FROM base AS builder
ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Канонічний домен для canonical, sitemap і Open Graph (вшивається у збірку)
ARG NEXT_PUBLIC_SITE_URL=https://xik.app
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# --- Prod target ---
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
