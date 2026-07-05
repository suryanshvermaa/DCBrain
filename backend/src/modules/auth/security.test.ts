import { Role } from '@prisma/client';
import { comparePassword, createAccessToken, createRefreshToken, hashPassword, verifyAccessToken, verifyRefreshToken } from './security';

describe('auth security helpers', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('Str0ng!Pass');

    expect(hash).not.toBe('Str0ng!Pass');
    await expect(comparePassword('Str0ng!Pass', hash)).resolves.toBe(true);
    await expect(comparePassword('Wrong!Pass1', hash)).resolves.toBe(false);
  });

  it('creates and verifies access tokens', () => {
    const { token } = createAccessToken({
      userId: 'user-123',
      email: 'engineer@example.com',
      role: Role.ENGINEER,
      projects: ['project-1'],
    });

    const claims = verifyAccessToken(token);

    expect(claims).toMatchObject({
      sub: 'user-123',
      email: 'engineer@example.com',
      role: Role.ENGINEER,
      projects: ['project-1'],
      tokenType: 'access',
    });
  });

  it('creates and verifies refresh tokens', () => {
    const { token } = createRefreshToken('user-123');

    expect(verifyRefreshToken(token)).toMatchObject({
      sub: 'user-123',
      tokenType: 'refresh',
    });
  });
});