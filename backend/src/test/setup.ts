import { config } from 'dotenv';

config({ path: '.env.test' });

jest.setTimeout(10000);

beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
});

afterAll(() => {
  // Cleanup if needed
});

jest.mock('@xenova/transformers', () => {
  return {
    pipeline: jest.fn().mockResolvedValue(async () => {
      return { tolist: () => [[0.1, 0.2, 0.3]] };
    }),
    env: {
      allowLocalModels: false,
    },
  };
});
