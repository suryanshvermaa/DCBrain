import { config } from 'dotenv';

config({ path: '.env.test' });

jest.setTimeout(10000);

beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
});

afterAll(() => {
  // Cleanup if needed
});

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn(async ({ input }: { input: string | string[] }) => {
          const items = Array.isArray(input) ? input : [input];
          return {
            data: items.map((_, index) => ({ index, embedding: [0.1, 0.2, 0.3] })),
          };
        }),
      },
    })),
  };
});
