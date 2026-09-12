import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface FingerprintParams {
  rawContent: string | Buffer;
  title: string;
  publicationDate?: Date;
  versionNumber?: number;
  sourceId: string;
}

@Injectable()
export class PolicyFingerprintService {
  generateFingerprint(params: FingerprintParams): { hash: string; size: number } {
    const contentBuffer = typeof params.rawContent === 'string' ? Buffer.from(params.rawContent) : params.rawContent;
    const size = contentBuffer.length;

    const hasher = createHash('sha256');
    hasher.update(contentBuffer);
    hasher.update(params.title);
    hasher.update(params.sourceId);
    if (params.publicationDate) hasher.update(params.publicationDate.toISOString());
    if (params.versionNumber) hasher.update(String(params.versionNumber));

    const hash = hasher.digest('hex');
    return { hash, size };
  }
}
