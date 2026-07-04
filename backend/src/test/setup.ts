import { config } from 'dotenv';

config({ path: '.env.test' });

jest.setTimeout(10000);

beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
});

afterAll(() => {
  // Cleanup if needed
});
