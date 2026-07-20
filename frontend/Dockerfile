# =============================================================================
# Stage 1: deps — install all node dependencies
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install

# =============================================================================
# Stage 2: builder — compile Next.js application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL=__NEXT_PUBLIC_API_URL_PLACEHOLDER__
ARG NEXT_PUBLIC_APP_NAME=__NEXT_PUBLIC_APP_NAME_PLACEHOLDER__
ARG BUILD_SHA=dev

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
    BUILD_SHA=${BUILD_SHA}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# =============================================================================
# Stage 3: runner — minimal production image (Next.js standalone)
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', (r) => process.exit(r.statusCode < 400 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]