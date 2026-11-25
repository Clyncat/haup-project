import { S3Client } from "@aws-sdk/client-s3";

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const common = {
  region: env("S3_REGION"),
  forcePathStyle: true,
  credentials: {
    accessKeyId: env("S3_ACCESS_KEY_ID"),
    secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  },

  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
} as const;

export const s3 = new S3Client({ ...common, endpoint: env("S3_ENDPOINT") });

export const s3Public = new S3Client({
  ...common,
  endpoint: env("S3_PUBLIC_ENDPOINT"),
});

export const bucket = env("S3_BUCKET");
