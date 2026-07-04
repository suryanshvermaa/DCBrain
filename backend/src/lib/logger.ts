import winston from 'winston';
import config from '@/core/config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let log = `${String(timestamp)} [${String(level)}]: ${String(message)}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${String(stack)}`;
    }
    return log;
  })
);

const transports: winston.transport[] = [];

if (config.LOG_FORMAT === 'console') {
  transports.push(new winston.transports.Console({ format: consoleFormat }));
} else {
  transports.push(new winston.transports.Console({ format: logFormat }));
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL.toLowerCase(),
  format: logFormat,
  transports,
  defaultMeta: { service: 'dcbrain-backend' },
  exitOnError: false,
});

export function createChildLogger(meta: Record<string, unknown>): winston.Logger {
  return logger.child(meta);
}
