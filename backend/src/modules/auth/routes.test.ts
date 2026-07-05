import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '@/app';
import { createAccessToken } from './security';

jest.mock('./service', () => ({
  register: jest.fn(async () => ({
    user: {
      id: 'user-1',
      email: 'new.user@example.com',
      firstName: 'New',
      lastName: 'User',
      role: Role.VIEWER,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
      projects: [],
    },
    token: {
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 86400,
      refreshToken: 'refresh-token',
      refreshTokenExpiresInSeconds: 604800,
    },
  })),
  login: jest.fn(),
  refresh: jest.fn(),
  getCurrentUser: jest.fn(async () => ({
    id: 'user-1',
    email: 'engineer@example.com',
    firstName: 'Eng',
    lastName: 'User',
    role: Role.ENGINEER,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
    projects: ['project-1'],
  })),
}));

jest.mock('./repository', () => ({
  findUserById: jest.fn(async (userId: string) => {
    if (userId === 'user-1') {
      return {
        id: 'user-1',
        email: 'engineer@example.com',
        passwordHash: 'hash',
        firstName: 'Eng',
        lastName: 'User',
        role: Role.ENGINEER,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date('2026-07-05T00:00:00.000Z'),
        updatedAt: new Date('2026-07-05T00:00:00.000Z'),
        projects: [{ projectId: 'project-1' }],
      };
    }

    return null;
  }),
}));

describe('auth routes', () => {
  it('registers a new user and sets a refresh cookie', async () => {
    const response = await request(createApp())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'New',
        lastName: 'User',
        email: 'new.user@example.com',
        password: 'Str0ng!Pass',
      });

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.body).toMatchObject({
      user: {
        email: 'new.user@example.com',
      },
      token: {
        accessToken: 'access-token',
        tokenType: 'Bearer',
      },
    });
  });

  it('enforces auth rate limiting on repeated login attempts', async () => {
    const serviceModule = await import('./service');
    (serviceModule.login as jest.Mock).mockImplementation(async () => {
      throw new Error('Invalid email or password');
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(createApp())
        .post('/api/v1/auth/login')
        .send({
          email: 'missing@example.com',
          password: 'Str0ng!Pass',
        });

      expect([500, 401, 400]).toContain(response.status);
    }

    const lockedResponse = await request(createApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'Str0ng!Pass',
      });

    expect(lockedResponse.status).toBe(429);
  });

  it('allows authenticated users to read their profile and blocks engineers from admin-only routes', async () => {
    const accessToken = createAccessToken({
      userId: 'user-1',
      email: 'engineer@example.com',
      role: Role.ENGINEER,
      projects: ['project-1'],
    }).token;

    const meResponse = await request(createApp())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toMatchObject({
      email: 'engineer@example.com',
      role: Role.ENGINEER,
    });

    const adminResponse = await request(createApp())
      .get('/api/v1/auth/admin-only')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(adminResponse.status).toBe(403);
  });
});