FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --config prisma7.config.ts
EXPOSE 5001
CMD ["sh", "-c", "npx prisma generate --config prisma7.config.ts && npx prisma migrate deploy --config prisma7.config.ts && npm run dev"]

FROM base AS builder
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate --config prisma7.config.ts && npm run build
RUN npm prune --omit=dev --ignore-scripts

FROM base AS prod
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/dist ./dist
EXPOSE 5001
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && npm run start"]
