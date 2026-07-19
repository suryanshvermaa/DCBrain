/** Minimal structured logger: pretty console output + JSONL file sink. */

import fs from 'node:fs';
import path from 'node:path';

type Level = 'info' | 'warn' | 'error' | 'success' | 'debug';

const COLORS: Record<Level, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  success: '\x1b[32m',
  debug: '\x1b[90m',
};
const RESET = '\x1b[0m';

export class Logger {
  private stream: fs.WriteStream | null = null;

  constructor(logFilePath?: string) {
    if (logFilePath) {
      fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
      this.stream = fs.createWriteStream(logFilePath, { flags: 'a' });
    }
  }

  private write(level: Level, msg: string, meta?: Record<string, unknown>): void {
    const ts = new Date().toISOString();
    const color = COLORS[level];
    const tag = level.toUpperCase().padEnd(7);
    // eslint-disable-next-line no-console
    console.log(`${color}${tag}${RESET} ${msg}${meta ? ' ' + dim(JSON.stringify(meta)) : ''}`);
    if (this.stream) {
      this.stream.write(JSON.stringify({ ts, level, msg, ...meta }) + '\n');
    }
  }

  info(msg: string, meta?: Record<string, unknown>): void {
    this.write('info', msg, meta);
  }
  warn(msg: string, meta?: Record<string, unknown>): void {
    this.write('warn', msg, meta);
  }
  error(msg: string, meta?: Record<string, unknown>): void {
    this.write('error', msg, meta);
  }
  success(msg: string, meta?: Record<string, unknown>): void {
    this.write('success', msg, meta);
  }
  debug(msg: string, meta?: Record<string, unknown>): void {
    if (process.env.DCBRAIN_DEBUG) this.write('debug', msg, meta);
  }

  close(): void {
    this.stream?.end();
  }
}

function dim(s: string): string {
  return `\x1b[90m${s}\x1b[0m`;
}
