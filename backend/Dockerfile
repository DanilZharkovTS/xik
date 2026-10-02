FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# --- Dev target ---
FROM base AS dev
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]

# --- Build stage for production ---
FROM base AS builder
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build || true

# --- Prod target ---
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
