import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const uploadToR2 = async (file: Buffer, filename: string, contentType: string): Promise<string> => {
  const key = `${randomUUID()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: "public-read",
  });

  await r2Client.send(command);

  return `${PUBLIC_URL}/${key}`;
};

export const getR2Key = (url: string): string => {
  return url.replace(`${PUBLIC_URL}/`, "");
};

export const deleteFromR2 = async (url: string): Promise<void> => {
  const key = url.replace(`${PUBLIC_URL}/`, "");

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
};