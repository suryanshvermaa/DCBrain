import { redis } from '@/lib/redis';
import { RateLimitError } from '@/core/errors';
import config from '@/core/config';

const AUTH_ATTEMPT_LIMIT = 5;
const AUTH_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const AUTH_LOCKOUT_SECONDS = 30 * 60;
const memoryState = new Map<string, { count: number; expiresAt: number; lockedUntil?: number }>();

function getKey(scope: string, ipAddress: string): string {
  return `auth:rate:${scope}:${ipAddress}`;
}

async function getState(key: string) {
  if (redis.status === 'ready') {
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
  if (redis.status === 'ready') {
    const ttl = Math.max(1, Math.ceil((state.lockedUntil ?? state.expiresAt) - Date.now()) / 1000);
    await redis.set(key, JSON.stringify(state), 'EX', Math.ceil(ttl));
    return;
  }

  memoryState.set(key, state);
}

export async function assertAuthRateLimit(scope: string, ipAddress: string): Promise<void> {
  if (config.APP_ENV === 'development') {
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
  if (config.APP_ENV === 'development') {
    return;
  }

  const key = getKey(scope, ipAddress);

  if (redis.status === 'ready') {
    await redis.del(key);
    return;
  }

  memoryState.delete(key);
}