import { Client as MinioClient } from 'minio';
import config from '@/core/config';
import { logger } from '@/lib/logger';

const globalForMinio = globalThis as unknown as {
  minio: MinioClient | undefined;
  publicMinio: MinioClient | undefined;
};

export const minio =
  globalForMinio.minio ??
  new MinioClient({
    endPoint: config.MINIO_ENDPOINT,
    port: config.MINIO_PORT,
    useSSL: config.MINIO_USE_SSL,
    accessKey: config.MINIO_ACCESS_KEY,
    secretKey: config.MINIO_SECRET_KEY,
  });

let publicMinioClient = globalForMinio.publicMinio;
if (!publicMinioClient) {
  if (config.MINIO_PUBLIC_URL) {
    const publicUrl = new URL(config.MINIO_PUBLIC_URL);
    publicMinioClient = new MinioClient({
      endPoint: publicUrl.hostname,
      port: publicUrl.port ? parseInt(publicUrl.port, 10) : (publicUrl.protocol === 'https:' ? 443 : 80),
      useSSL: publicUrl.protocol === 'https:',
      accessKey: config.MINIO_ACCESS_KEY,
      secretKey: config.MINIO_SECRET_KEY,
      region: 'us-east-1',
    });
  } else {
    publicMinioClient = minio;
  }
}
export const publicMinio = publicMinioClient;

if (process.env['NODE_ENV'] !== 'production') {
  globalForMinio.minio = minio;
  globalForMinio.publicMinio = publicMinio;
}

export async function ensureBucketExists(): Promise<void> {
  const bucketName = config.MINIO_BUCKET_NAME;
  const exists = await minio.bucketExists(bucketName);
  if (!exists) {
    await minio.makeBucket(bucketName, 'us-east-1');
    logger.info('Created MinIO bucket', { bucketName });
  }
}

export async function checkMinioHealth(): Promise<boolean> {
  try {
    await minio.listBuckets();
    return true;
  } catch {
    return false;
  }
}

export function getPresignedUploadUrl(objectName: string, expirySeconds = 3600): Promise<string> {
  return publicMinio.presignedPutObject(config.MINIO_BUCKET_NAME, objectName, expirySeconds);
}

export function getPresignedDownloadUrl(objectName: string, expirySeconds = 3600): Promise<string> {
  return publicMinio.presignedGetObject(config.MINIO_BUCKET_NAME, objectName, expirySeconds);
}

export async function uploadFile(
  objectName: string,
  filePath: string,
  metaData?: Record<string, string>
): Promise<void> {
  await minio.fPutObject(config.MINIO_BUCKET_NAME, objectName, filePath, metaData);
}

export async function uploadBuffer(
  objectName: string,
  buffer: Buffer,
  metaData?: Record<string, string>
): Promise<void> {
  await minio.putObject(config.MINIO_BUCKET_NAME, objectName, buffer, buffer.length, metaData);
}

export async function downloadFile(objectName: string, filePath: string): Promise<void> {
  await minio.fGetObject(config.MINIO_BUCKET_NAME, objectName, filePath);
}

export async function getObjectStream(objectName: string): Promise<NodeJS.ReadableStream> {
  return minio.getObject(config.MINIO_BUCKET_NAME, objectName);
}

export async function deleteObject(objectName: string): Promise<void> {
  await minio.removeObject(config.MINIO_BUCKET_NAME, objectName);
}

export default minio;
