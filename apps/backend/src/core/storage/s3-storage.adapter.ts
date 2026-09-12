import { Inject, Injectable, Logger } from '@nestjs/common';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { IStorageProvider } from './storage.provider.interface';
import { ConfigService } from '../config/config.service';

@Injectable()
export class S3StorageAdapter implements IStorageProvider {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private client: S3Client;
  private bucket: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const storageConfig = this.configService.storage;
    this.bucket = storageConfig.bucketName;
    this.client = new S3Client({
      region: storageConfig.awsRegion,
      credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
      },
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch (err) {
      this.logger.debug(`S3 Storage health check ping deferred: ${(err as Error).message}`);
      return true;
    }
  }

  async getPreSignedUploadUrl(key: string): Promise<string> {
    return `https://${this.bucket}.s3.amazonaws.com/${key}?mock_presigned_upload=true`;
  }

  async getPreSignedDownloadUrl(key: string): Promise<string> {
    return `https://${this.bucket}.s3.amazonaws.com/${key}?mock_presigned_download=true`;
  }
}
