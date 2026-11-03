# 1. Aşama: Admin Panel (Vite + React + Tailwind) Build
FROM node:20-alpine AS admin-builder

WORKDIR /admin-build

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
RUN npm run build

# 2. Aşama: Production API + Built Admin Static Bundle
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node api/ ./
COPY --from=admin-builder --chown=node:node /admin-build/dist ./public/admin

USER node

EXPOSE 3000

CMD ["node", "server.js"]
