import { redis } from '@/lib/redis';
import { RateLimitError } from '@/core/errors';

const AUTH_ATTEMPT_LIMIT = 5;
const AUTH_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const AUTH_LOCKOUT_SECONDS = 30 * 60;
const memoryState = new Map<string, { count: number; expiresAt: number; lockedUntil?: number }>();

function getRuntimeEnv(): string {
  return process.env['APP_ENV'] ?? process.env['NODE_ENV'] ?? 'development';
}

function isTestRuntime(): boolean {
  return process.env['APP_ENV'] === 'test' || process.env['NODE_ENV'] === 'test' || typeof process.env['JEST_WORKER_ID'] !== 'undefined';
}

/**
 * Rate limiting is enforced in every environment. The only bypass is an
 * explicit opt-out flag intended for tests/local tooling — it is never
 * inferred from the runtime environment.
 */
function isRateLimitDisabled(): boolean {
  return process.env['DISABLE_RATE_LIMIT'] === 'true';
}

function shouldUseMemoryStore(): boolean {
  const env = getRuntimeEnv();

  return env === 'test' || env === 'development' || isTestRuntime() || ['wait', 'reconnecting', 'end', 'close'].includes(redis.status);
}

function normalizeIpAddress(ipAddress: string): string {
  const trimmed = ipAddress.trim();

  if (!trimmed) {
    return '127.0.0.1';
  }

  return trimmed.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
}

function getKey(scope: string, ipAddress: string): string {
  return `auth:rate:${scope}:${normalizeIpAddress(ipAddress)}`;
}

async function getState(key: string) {
  if (redis.status === 'ready' && !shouldUseMemoryStore()) {
    const stored = await redis.get(key);
    return stored ? JSON.parse(stored) as { count: number; expiresAt: number; lockedUntil?: number } : null;
  }

  const entry = memoryState.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    memoryState.delete(key);
    return null;
  }

  return entry;
}

async function saveState(key: string, state: { count: number; expiresAt: number; lockedUntil?: number }) {
  if (redis.status === 'ready' && !shouldUseMemoryStore()) {
    const ttl = Math.max(1, Math.ceil((state.lockedUntil ?? state.expiresAt) - Date.now()) / 1000);
    await redis.set(key, JSON.stringify(state), 'EX', Math.ceil(ttl));
    return;
  }

  memoryState.set(key, state);
}

export async function assertAuthRateLimit(scope: string, ipAddress: string): Promise<void> {
  if (isRateLimitDisabled()) {
    return;
  }

  const key = getKey(scope, ipAddress);
  const state = await getState(key);
  const now = Date.now();

  if (state?.lockedUntil && state.lockedUntil > now) {
    throw new RateLimitError('Too many authentication attempts. Please try again later.');
  }

  const expiresAt = state?.expiresAt ?? now + AUTH_ATTEMPT_WINDOW_SECONDS * 1000;
  const count = (state?.count ?? 0) + 1;

  if (state?.count && state.count >= AUTH_ATTEMPT_LIMIT) {
    const lockedState = {
      count,
      expiresAt,
      lockedUntil: now + AUTH_LOCKOUT_SECONDS * 1000,
    };
    await saveState(key, lockedState);
    throw new RateLimitError('Too many authentication attempts. Please try again later.');
  }

  if (count > AUTH_ATTEMPT_LIMIT) {
    const lockedState = {
      count,
      expiresAt,
      lockedUntil: now + AUTH_LOCKOUT_SECONDS * 1000,
    };
    await saveState(key, lockedState);
    throw new RateLimitError('Too many authentication attempts. Please try again later.');
  }

  await saveState(key, { count, expiresAt, lockedUntil: state?.lockedUntil });
}

export async function resetAuthRateLimit(scope: string, ipAddress: string): Promise<void> {
  if (isRateLimitDisabled()) {
    return;
  }

  const key = getKey(scope, ipAddress);

  if (redis.status === 'ready' && !shouldUseMemoryStore()) {
    await redis.del(key);
    return;
  }

  memoryState.delete(key);
}