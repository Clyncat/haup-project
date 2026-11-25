import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Public, bucket } from "./s3.ts";

export function imageUrl(key: string | null, expiresIn = 3600) {
  if (!key) return null;
  return getSignedUrl(
    s3Public,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}
