#!/bin/sh
# Inject runtime environment variables into Next.js static build
# This enables "build once, run anywhere" by replacing placeholders with actual env vars.

echo "Injecting runtime environment variables..."

# Placeholders used during the docker build
API_URL_PLACEHOLDER="__NEXT_PUBLIC_API_URL_PLACEHOLDER__"
APP_NAME_PLACEHOLDER="__NEXT_PUBLIC_APP_NAME_PLACEHOLDER__"

# Target runtime values (fallback to placeholder if missing)
RUNTIME_API_URL="${NEXT_PUBLIC_API_URL:-$API_URL_PLACEHOLDER}"
RUNTIME_APP_NAME="${NEXT_PUBLIC_APP_NAME:-$APP_NAME_PLACEHOLDER}"

# Run replacement across all generated JS and HTML files
find /app/.next -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|$API_URL_PLACEHOLDER|$RUNTIME_API_URL|g" {} +
find /app/.next -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|$APP_NAME_PLACEHOLDER|$RUNTIME_APP_NAME|g" {} +

echo "Starting Next.js..."
exec "$@"
