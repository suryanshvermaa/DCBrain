import { minio } from './src/lib/minio';
import config from './src/core/config';

async function test() {
  const url = await minio.presignedGetObject(config.MINIO_BUCKET_NAME, 'test.pdf', 3600);
  console.log(url);
}

test().catch(console.error);
