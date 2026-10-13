import crypto from "crypto";

interface UploadInvoicePdfInput {
  fileName: string;
  pdfBuffer: Buffer;
  invoiceId: string;
  metadata?: Record<string, string>;
}

interface UploadInvoicePdfOutput {
  s3Key: string;
  uploadedAt: string;
  fileSize: number;
}

interface GenerateDownloadUrlInput {
  s3Key: string;
}

interface GenerateDownloadUrlOutput {
  downloadUrl: string;
  expiresAt: string;
}

interface DeleteExpiredFilesInput {
  olderThanDays: number;
}

interface DeleteExpiredFilesOutput {
  deletedCount: number;
  failedCount: number;
}

interface FileStorageAdapter {
  uploadInvoicePdf(input: UploadInvoicePdfInput): Promise<UploadInvoicePdfOutput>;
  generateDownloadUrl(input: GenerateDownloadUrlInput): Promise<GenerateDownloadUrlOutput>;
  deleteExpiredFiles(input: DeleteExpiredFilesInput): Promise<DeleteExpiredFilesOutput>;
}

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  presignedUrlExpirationSeconds: number;
}

interface RetryQueueItem {
  fileName: string;
  pdfBuffer: Buffer;
  invoiceId: string;
  metadata?: Record<string, string>;
  retryCount: number;
  nextRetryTime: number;
}

const RETRY_DELAYS_MS = [1000, 5000, 30000, 120000, 300000];
const MAX_RETRIES = 5;

function getRetryDelay(retryCount: number): number {
  if (retryCount >= RETRY_DELAYS_MS.length) {
    return RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  }
  return RETRY_DELAYS_MS[retryCount];
}

function calculateSignature(
  method: string,
  bucket: string,
  key: string,
  config: S3Config,
  timestamp: string,
  amzDate: string
): string {
  const host = `${bucket}.s3.${config.region}.amazonaws.com`;
  const canonicalUri = `/${key}`;
  const canonicalQuerystring = "";
  const payloadHash = crypto.createHash("sha256").update("").digest("hex");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
    "host;x-amz-content-sha256;x-amz-date",
    payloadHash,
  ].join("\n");

  const canonicalRequestHash = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const credentialScope = `${timestamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  const kDate = crypto
    .createHmac("sha256", `AWS4${config.secretAccessKey}`)
    .update(timestamp)
    .digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(config.region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return signature;
}

function generatePresignedUrl(
  bucket: string,
  key: string,
  config: S3Config
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");

  const credentialScope = `${timestamp}/${config.region}/s3/aws4_request`;
  const credential = `${config.accessKeyId}/${credentialScope}`;

  const canonicalQuerystring = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(credential)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${config.presignedUrlExpirationSeconds}`,
    `X-Amz-SignedHeaders=host`,
  ].join("&");

  const host = `${bucket}.s3.${config.region}.amazonaws.com`;
  const canonicalUri = `/${key}`;
  const payloadHash = crypto.createHash("sha256").update("").digest("hex");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuerystring,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
    "host;x-amz-content-sha256;x-amz-date",
    payloadHash,
  ].join("\n");

  const canonicalRequestHash = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  const kDate = crypto
    .createHmac("sha256", `AWS4${config.secretAccessKey}`)
    .update(timestamp)
    .digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(config.region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
}

async function uploadToS3WithRetry(
  bucket: string,
  key: string,
  body: Buffer,
  config: S3Config,
  retryCount: number = 0
): Promise<void> {
  try {
    const host = `${bucket}.s3.${config.region}.amazonaws.com`;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");

    const payloadHash = crypto.createHash("sha256").update(body).digest("hex");

    const canonicalRequest = [
      "PUT",
      `/${key}`,
      "",
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      "",
      "host;x-amz-content-sha256;x-amz-date",
      payloadHash,
    ].join("\n");

    const canonicalRequestHash = crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex");

    const credentialScope = `${timestamp}/${config.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join("\n");

    const kDate = crypto
      .createHmac("sha256", `AWS4${config.secretAccessKey}`)
      .update(timestamp)
      .digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(config.region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    const credential = `${config.accessKeyId}/${credentialScope}`;
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

    const response = await fetch(`https://${host}/${key}`, {
      method: "PUT",
      headers: {
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        authorization: authorizationHeader,
        "content-length": body.length.toString(),
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `S3 upload failed with status ${response.status}: ${errorText}`
      );
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return uploadToS3WithRetry(bucket, key, body, config, retryCount + 1);
    }
    throw error;
  }
}

export function loadS3Config(): S3Config {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_S3_REGION;
  const presignedUrlExpirationSecondsStr =
    process.env.AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS;

  const missingVars: string[] = [];

  if (!accessKeyId) missingVars.push("AWS_ACCESS_KEY_ID");
  if (!secretAccessKey) missingVars.push("AWS_SECRET_ACCESS_KEY");
  if (!bucketName) missingVars.push("AWS_S3_BUCKET_NAME");
  if (!region) missingVars.push("AWS_S3_REGION");
  if (!presignedUrlExpirationSecondsStr)
    missingVars.push("AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  const presignedUrlExpirationSeconds = parseInt(
    presignedUrlExpirationSecondsStr!,
    10
  );

  if (isNaN(presignedUrlExpirationSeconds)) {
    throw new Error(
      "AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS must be a valid number"
    );
  }

  if (presignedUrlExpirationSeconds > 43200) {
    throw new Error(
      "AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS cannot exceed 43200 seconds (12 hours)"
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    presignedUrlExpirationSeconds,
  };
}

export function createAmazonS3Adapter(config: S3Config): FileStorageAdapter {
  const retryQueue: RetryQueueItem[] = [];
  let processingQueue = false;

  async function processRetryQueue(): Promise<void> {
    if (processingQueue || retryQueue.length === 0) {
      return;
    }

    processingQueue = true;

    try {
      while (retryQueue.length > 0) {
        const now = Date.now();
        const item = retryQueue[0];

        if (item.nextRetryTime > now) {
          const delay = item.nextRetryTime - now;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        try {
          const s3Key = `invoices/${item.invoiceId}/${item.fileName}`;
          await uploadToS3WithRetry(
            config.bucketName,
            s3Key,
            item.pdfBuffer,
            config,
            item.retryCount
          );
          retryQueue.shift();
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= MAX_RETRIES) {
            retryQueue.shift();
            console.error(
              `Failed to upload ${item.fileName} after ${MAX_RETRIES} retries:`,
              error
            );
          } else {
            item.nextRetryTime = now + getRetryDelay(item.retryCount);
          }
        }
      }
    } finally {
      processingQueue = false;
    }
  }

  return {
    async uploadInvoicePdf(
      input: UploadInvoicePdfInput
    ): Promise<UploadInvoicePdfOutput> {
      const s3Key = `invoices/${input.invoiceId}/${input.fileName}`;

      try {
        await uploadToS3WithRetry(
          config.bucketName,
          s3Key,
          input.pdfBuffer,
          config,
          0
        );

        return {
          s3Key,
          uploadedAt: new Date().toISOString(),
          fileSize: input.pdfBuffer.length,
        };
      } catch (error) {
        retryQueue.push({
          fileName: input.fileName,
          pdfBuffer: input.pdfBuffer,
          invoiceId: input.invoiceId,
          metadata: input.metadata,
          retryCount: 0,
          nextRetryTime: Date.now() + getRetryDelay(0),
        });

        processRetryQueue().catch((err) => {
          console.error("Error processing retry queue:", err);
        });

        throw new Error("ファイル保存に失敗しました。再度お試しください");
      }
    },

    async generateDownloadUrl(
      input: GenerateDownloadUrlInput
    ): Promise<GenerateDownloadUrlOutput> {
      const downloadUrl = generatePresignedUrl(
        config.bucketName,
        input.s3Key,
        config
      );

      const expiresAt = new Date(
        Date.now() + config.presignedUrlExpirationSeconds * 1000
      ).toISOString();

      return {
        downloadUrl,
        expiresAt,
      };
    },

    async deleteExpiredFiles(
      input: DeleteExpiredFilesInput
    ): Promise<DeleteExpiredFilesOutput> {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

      let deletedCount = 0;
      let failedCount = 0;

      const host = `${config.bucketName}.s3.${config.region}.amazonaws.com`;
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
      const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");

      const payloadHash = crypto.createHash("sha256").update("").digest("hex");

      const canonicalRequest = [
        "GET",
        "/",
        "list-type=2&prefix=invoices/",
        `host:${host}`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${amzDate}`,
        "",
        "host;x-amz-content-sha256;x-amz-date",
        payloadHash,
      ].join("\n");

      const canonicalRequestHash = crypto
        .createHash("sha256")
        .update(canonicalRequest)
        .digest("hex");

      const credentialScope = `${timestamp}/${config.region}/s3/aws4_request`;
      const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        credentialScope,
        canonicalRequestHash,
      ].join("\n");

      const kDate = crypto
        .createHmac("sha256", `AWS4${config.secretAccessKey}`)
        .update(timestamp)
        .digest();
      const kRegion = crypto.createHmac("sha256", kDate).update(config.region).digest();
      const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
      const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

      const signature = crypto
        .createHmac("sha256", kSigning)
        .update(stringToSign)
        .digest("hex");

      const credential = `${config.accessKeyId}/${credentialScope}`;
      const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

      try {
        const listResponse = await fetch(
          `https://${host}/?list-type=2&prefix=invoices/`,
          {
            method: "GET",
            headers: {
              "x-amz-date": amzDate,
              "x-amz-content-sha256": payloadHash,
              authorization: authorizationHeader,
            },
          }
        );

        if (!listResponse.ok) {
          throw new Error(
            `Failed to list S3 objects: ${listResponse.statusText}`
          );
        }

        const listText = await listResponse.text();
        const parser = new (require("util").TextDecoder)();

        const keyMatches = listText.match(/<Key>([^<]+)<\/Key>/g) || [];
        const keysToDelete: string[] = [];

        for (const match of keyMatches) {
          const key = match.replace(/<\/?Key>/g, "");
          const lastModifiedMatch = listText.match(
            new RegExp(`<Key>${key}</Key>.*?<LastModified>([^<]+)</LastModified>`)
          );

          if (lastModifiedMatch) {
            const lastModified = new Date(lastModifiedMatch[1]);
            if (lastModified < cutoffDate) {
              keysToDelete.push(key);
            }
          }
        }

        for (const key of keysToDelete) {
          try {
            const deleteTimestamp = new Date()
              .toISOString()
              .replace(/[:-]|\.\d{3}/g, "")
              .slice(0, 8);
            const deleteAmzDate = new Date()
              .toISOString()
              .replace(/[:-]|\.\d{3}/g, "");

            const deletePayloadHash = crypto
              .createHash("sha256")
              .update("")
              .digest("hex");

            const deleteCanonicalRequest = [
              "DELETE",
              `/${key}`,
              "",
              `host:${host}`,
              `x-amz-content-sha256:${deletePayloadHash}`,
              `x-amz-date:${deleteAmzDate}`,
              "",
              "host;x-amz-content-sha256;x-amz-date",
              deletePayloadHash,
            ].join("\n");

            const deleteCanonicalRequestHash = crypto
              .createHash("sha256")
              .update(deleteCanonicalRequest)
              .digest("hex");

            const deleteCredentialScope = `${deleteTimestamp}/${config.region}/s3/aws4_request`;
            const deleteStringToSign = [
              "AWS4-HMAC-SHA256",
              deleteAmzDate,
              deleteCredentialScope,
              deleteCanonicalRequestHash,
            ].join("\n");

            const deleteKDate = crypto
              .createHmac("sha256", `AWS4${config.secretAccessKey}`)
              .update(deleteTimestamp)
              .digest();
            const deleteKRegion = crypto
              .createHmac("sha256", deleteKDate)
              .update(config.region)
              .digest();
            const deleteKService = crypto
              .createHmac("sha256", deleteKRegion)
              .update("s3")
              .digest();
            const deleteKSigning = crypto
              .createHmac("sha256", deleteKService)
              .update("aws4_request")
              .digest();

            const deleteSignature = crypto
              .createHmac("sha256", deleteKSigning)
              .update(deleteStringToSign)
              .digest("hex");

            const deleteCredential = `${config.accessKeyId}/${deleteCredentialScope}`;
            const deleteAuthorizationHeader = `AWS4-HMAC-SHA256 Credential=${deleteCredential}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${deleteSignature}`;

            const deleteResponse = await fetch(`https://${host}/${key}`, {
              method: "DELETE",
              headers: {
                "x-amz-date": deleteAmzDate,
                "x-amz-content-sha256": deletePayloadHash,
                authorization: deleteAuthorizationHeader,
              },
            });

            if (deleteResponse.ok) {
              deletedCount++;
            } else {
              failedCount++;
            }
          } catch (error) {
            failedCount++;
          }
        }
      } catch (error) {
        throw new Error(`Failed to delete expired files: ${error}`);
      }

      return {
        deletedCount,
        failedCount,
      };
    },
  };
}
