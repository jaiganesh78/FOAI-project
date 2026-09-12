export interface IStorageProvider {
  isHealthy(): Promise<boolean>;
  getPreSignedUploadUrl(key: string, expiresSeconds?: number): Promise<string>;
  getPreSignedDownloadUrl(key: string, expiresSeconds?: number): Promise<string>;
}
