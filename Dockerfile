FROM node:20-slim AS base

# Install system deps + Tectonic
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libssl-dev \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Install Tectonic
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv /root/.cargo/bin/tectonic /usr/local/bin/tectonic || \
    (curl -sL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz | tar xz -C /usr/local/bin/)

# Warm Tectonic package cache with a minimal compile
RUN mkdir -p /tmp/tex-warm && \
    echo '\\documentclass{article}\\begin{document}Hello\\end{document}' > /tmp/tex-warm/warm.tex && \
    tectonic -X compile /tmp/tex-warm/warm.tex --outdir /tmp/tex-warm || true && \
    rm -rf /tmp/tex-warm

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
