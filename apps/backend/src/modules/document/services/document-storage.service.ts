import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../../../core/tokens/injection-tokens';
import { IStorageProvider } from '../../../core/storage/storage.provider.interface';

@Injectable()
export class DocumentStorageService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider) {}

  async storeFile(fileName: string, _content: Buffer, _mimeType: string): Promise<string> {
    const key = `documents/${Date.now()}-${fileName}`;
    return this.storageProvider.getPreSignedUploadUrl(key, 3600);
  }

  async getFileUrl(key: string): Promise<string> {
    return this.storageProvider.getPreSignedDownloadUrl(key, 3600);
  }
}
