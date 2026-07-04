import request from 'supertest';
import { createApp } from './app';

describe('Application', () => {
  it('GET /api returns API metadata', async () => {
    const response = await request(createApp()).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'DCBrain',
      version: '0.1.0',
      documentation: '/docs',
      openapi: '/openapi.json',
    });
  });

  it('GET /openapi.json returns the OpenAPI spec', async () => {
    const response = await request(createApp()).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi', '3.0.3');
    expect(response.body).toHaveProperty('info.title', 'DCBrain');
    expect(response.body).toHaveProperty(['paths', '/health']);
  });

  it('GET /docs serves Swagger UI', async () => {
    const response = await request(createApp()).get('/docs').redirects(1);

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger');
  });
});
