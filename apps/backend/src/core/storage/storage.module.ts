import { Global, Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../tokens/injection-tokens';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  providers: [
    S3StorageAdapter,
    {
      provide: STORAGE_PROVIDER,
      useExisting: S3StorageAdapter,
    },
  ],
  exports: [STORAGE_PROVIDER, S3StorageAdapter],
})
export class StorageModule {}
