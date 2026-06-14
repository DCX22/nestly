# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
RUN if [ -d public ]; then cp -r public ./public; fi

RUN ./node_modules/.bin/vite build

# ── Stage 2: Build server ─────────────────────────────────────────────────────
FROM node:22-alpine AS server-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm install

COPY server/tsconfig.json ./
COPY server/src ./src

RUN ./node_modules/.bin/tsc

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Server production dependencies only
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

# Compiled server goes to /app/server-dist
COPY --from=server-builder /app/server/dist ./server-dist

# Built frontend goes to /app/public
COPY --from=frontend-builder /app/dist ./public

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "server-dist/index.js"]
