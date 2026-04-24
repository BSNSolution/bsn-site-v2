import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function assertR2Env() {
  const missing = [
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 não configurado. Faltam env vars: ${missing.join(", ")}`
    );
  }
}

let _r2Client: S3Client | null = null;
function getClient(): S3Client {
  if (_r2Client) return _r2Client;
  assertR2Env();
  _r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _r2Client;
}

export const uploadToR2 = async (
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  assertR2Env();
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;
  // Sanitiza nome pra evitar chars problemáticos
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${randomUUID()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await getClient().send(command);

  return `${publicUrl}/${key}`;
};

export const getR2Key = (url: string): string => {
  const publicUrl = process.env.R2_PUBLIC_URL ?? "";
  return url.replace(`${publicUrl}/`, "");
};

export const deleteFromR2 = async (url: string): Promise<void> => {
  assertR2Env();
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;
  const key = url.replace(`${publicUrl}/`, "");

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await getClient().send(command);
};