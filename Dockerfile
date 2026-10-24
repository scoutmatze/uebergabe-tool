# syntax=docker/dockerfile:1
# Debian-Basis (nicht Alpine): faster-whisper/PyAV haben hier fertige Wheels.
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 python3-pip ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# --- deps (npm) ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# --- builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# next.config.ts: output "standalone" ist Pflicht, sonst bricht dieser Schritt.
RUN npm run build

# --- runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m -s /bin/bash nextjs
RUN mkdir -p /data/audio /data/material && chown -R nextjs:nodejs /data

# Python-Deps (faster-whisper) direkt im Runner installieren (robuster als Cross-Stage-Copy).
COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
