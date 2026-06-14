# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
RUN if [ -d public ]; then cp -r public ./public; fi

RUN node node_modules/vite/bin/vite.js build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install production server dependencies (includes tsx)
COPY server/package.json ./
RUN npm install --omit=dev

# Server source (tsx runs it directly — no compile step needed)
COPY server/src ./src

# Built frontend served as static files
COPY --from=frontend-builder /app/dist ./public

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node_modules/.bin/tsx", "src/index.ts"]
