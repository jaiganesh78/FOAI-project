import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const storageConfigSchema = z.object({
  awsRegion: z.string().default('us-east-1'),
  accessKeyId: z.string().default('placeholder_key_id'),
  secretAccessKey: z.string().default('placeholder_secret'),
  bucketName: z.string().default('gpios-policy-documents'),
});

export type StorageConfigType = z.infer<typeof storageConfigSchema>;

export const storageConfig = registerAs('storage', (): StorageConfigType => {
  return storageConfigSchema.parse({
    awsRegion: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET,
  });
});
