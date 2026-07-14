import { connectRedis, redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

describe('connectRedis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not throw when Redis is unavailable', async () => {
    const connectSpy = jest.spyOn(redis, 'connect').mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined as never);

    await expect(connectRedis()).resolves.toBeUndefined();
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});
