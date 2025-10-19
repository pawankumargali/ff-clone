import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


import config from "../../config.js";
import { APIError } from "openai";

export const s3 = new S3Client({
  region: config.AWS.S3.REGION,
  // credentials: picked up from env/role; keep bucket private
});

export async function createUploadPresignedPost(
    userId: number,  
    params: {
      key: string;
      contentType: string;
    }
) {

  const Expires = config.AWS.S3.EXPIRE;

  const result = await createPresignedPost(s3, {
    Bucket: config.AWS.S3.BUCKET,
    Key: params.key,
    Expires,
    Fields: {
      "Content-Type": params.contentType,
      "x-amz-server-side-encryption": "AES256",
      // helpful 201 response from S3 containing ETag/key
      "success_action_status": "201",
      // bind user in object metadata (lets you verify on processing)
      "x-amz-meta-user-id": userId.toString(),
      // bind user in object metadata (lets you verify on processing)
    },
    Conditions: [
      // exact match on type (no OR in S3 policies, so we generate per type)
      ["eq", "$Content-Type", params.contentType],
      // must include same metadata
      ["eq", "$x-amz-meta-user-id", userId.toString()],
      // enforce SSE-S3
      ["eq", "$x-amz-server-side-encryption", "AES256"],
      // size cap
      ["content-length-range", 1, config.AWS.S3.MAX_BYTES],
      // anchor to this exact key
      // ["eq", "$key", params.key],
    ],
  });

  return {
    url: result.url,
    fields: result.fields,
    key: params.key,
    expiresInSeconds: Expires,
    maxBytes: config.AWS.S3.MAX_BYTES
  };
}


export async function getObjectLocationURL(Bucket: string, Key: string): Promise<string> {
  const signed = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket, Key }),
    { expiresIn: 900 } // seconds
  );
  return signed.split("?")[0];
}


export async function readJsonFromS3(Bucket: string, Key: string) {
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key }));
    // In Node 18+, AWS SDK v3 streams support .transformToString()
    const text = await Body!.transformToString("utf-8");
    return JSON.parse(text);
  } catch(e) {
    throw e;
  }
}
