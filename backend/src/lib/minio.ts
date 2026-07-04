import { Client as MinioClient } from 'minio';
import config from '@/core/config';
import { logger } from '@/lib/logger';

const globalForMinio = globalThis as unknown as {
  minio: MinioClient | undefined;
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

if (process.env['NODE_ENV'] !== 'production') {
  globalForMinio.minio = minio;
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
  return minio.presignedPutObject(config.MINIO_BUCKET_NAME, objectName, expirySeconds);
}

export function getPresignedDownloadUrl(objectName: string, expirySeconds = 3600): Promise<string> {
  return minio.presignedGetObject(config.MINIO_BUCKET_NAME, objectName, expirySeconds);
}

export async function uploadFile(
  objectName: string,
  filePath: string,
  metaData?: Record<string, string>
): Promise<void> {
  await minio.fPutObject(config.MINIO_BUCKET_NAME, objectName, filePath, metaData);
}

export async function downloadFile(objectName: string, filePath: string): Promise<void> {
  await minio.fGetObject(config.MINIO_BUCKET_NAME, objectName, filePath);
}

export async function deleteObject(objectName: string): Promise<void> {
  await minio.removeObject(config.MINIO_BUCKET_NAME, objectName);
}

export default minio;
