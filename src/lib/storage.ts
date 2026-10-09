import "server-only";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.S3_BUCKET ?? "uploads";
const DOWNLOAD_URL_TTL_SECONDS = 300;

let cached: S3Client | null = null;

function getClient(): S3Client | null {
  if (cached) return cached;

  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  cached = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

export function isStorageConfigured(): boolean {
  return getClient() !== null;
}

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+/, "");
  return (cleaned || "document").slice(-80);
}

function sanitizeHeaderValue(name: string): string {
  return name.replace(/["\\\r\n]/g, "_");
}

export async function uploadDocumentFile(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
  fileName: string;
}): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("STORAGE_NOT_CONFIGURED");

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ContentDisposition: `inline; filename="${sanitizeHeaderValue(input.fileName)}"`,
    }),
  );
}

export async function getDocumentDownloadUrl(
  key: string,
  fileName: string,
): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("STORAGE_NOT_CONFIGURED");

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${sanitizeHeaderValue(fileName)}"`,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
}
