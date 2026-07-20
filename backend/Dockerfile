# =============================================================================
# Stage 1: deps — install ALL dependencies (including devDeps for build tools)
# =============================================================================
FROM node:20-slim AS deps

WORKDIR /app

# Native build tools required by bcrypt, sharp, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# =============================================================================
# Stage 2: builder — compile TypeScript
# =============================================================================
FROM deps AS builder

ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src/
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Prune to production-only deps after build
RUN npm prune --production

# =============================================================================
# Stage 3: runner — lean production image
# =============================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime-only system libs (needed by sharp, bcrypt native binaries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=8000

# Copy only what is needed to run
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/prisma        ./prisma
COPY package.json ./

COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Run as non-root user (node user ships with node:20-slim)
USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:8000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/server.js"]