/**
 * Rate-limit detection + cooldown policy.
 *
 * Findings from the DCBrain backend (verified from source):
 *   • The document / procurement / schedule *upload* endpoints have NO HTTP rate
 *     limiter today.
 *   • Only auth (login/register/refresh) is limited: 5 attempts / 15 min → a
 *     30-min lockout, surfaced as HTTP 429 with code RATE_LIMIT_EXCEEDED and the
 *     message "Too many ... attempts" (see backend auth/rateLimit.ts).
 *
 * Because a future deployment could add upload throttling (and the brief asks us
 * to assume conservative limits when they can't be proven absent), this module
 * treats rate limiting *defensively*: we watch every server response for a 429 /
 * "Too Many Requests" / lockout signal and, when seen, pause for a cooldown and
 * retry — aborting only if the limit persists across the configured attempts.
 */

/** Signals that indicate we have hit (or are about to hit) a rate limit. */
const RATE_LIMIT_PATTERNS: RegExp[] = [
  /\b429\b/,
  /too many requests/i,
  /too many .*attempts/i,
  /rate[_ -]?limit/i,
  /RATE_LIMIT_EXCEEDED/,
  /retry[- ]?after/i,
];

export class RateLimitHit extends Error {
  /** Suggested wait (ms) parsed from a Retry-After header, if any. */
  readonly retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'RateLimitHit';
    this.retryAfterMs = retryAfterMs;
  }
}

/** True if an arbitrary error / message / status looks like a rate-limit response. */
export function isRateLimit(input: unknown): boolean {
  if (input instanceof RateLimitHit) return true;
  if (typeof input === 'number') return input === 429;
  const text =
    input instanceof Error ? `${input.message}` : typeof input === 'string' ? input : safeStringify(input);
  return RATE_LIMIT_PATTERNS.some((re) => re.test(text));
}

/** Parse a Retry-After header value (seconds or HTTP-date) into ms, if present. */
export function retryAfterToMs(headerValue: string | null | undefined, nowMs: number): number | undefined {
  if (!headerValue) return undefined;
  const asSeconds = Number(headerValue);
  if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds * 1000);
  const asDate = Date.parse(headerValue);
  if (Number.isFinite(asDate)) return Math.max(0, asDate - nowMs);
  return undefined;
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
