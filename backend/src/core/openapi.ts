import config from '@/core/config';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: config.APP_NAME,
    description: 'DCBrain API - AI Platform for Data Centre EPC',
    version: config.APP_VERSION,
    contact: {
      name: 'DCBrain Team',
      url: 'https://github.com/suryanshvermaa/DCBrain',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API prefix',
    },
    {
      url: 'http://localhost:8000/api',
      description: 'Local development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns the overall health status of the API and its dependencies.',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    environment: { type: 'string' },
                    services: {
                      type: 'object',
                      additionalProperties: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'One or more dependencies are unhealthy',
          },
        },
      },
    },
    '/': {
      get: {
        tags: ['System'],
        summary: 'API root',
        description: 'Returns API metadata and a map of available endpoint prefixes.',
        responses: {
          '200': {
            description: 'API metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    version: { type: 'string' },
                    description: { type: 'string' },
                    documentation: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [{ name: 'System', description: 'System-level endpoints' }],
} as const;
