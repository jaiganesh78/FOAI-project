import { describe, it, expect } from 'vitest';
import { PolicyFingerprintService } from '../../../src/modules/knowledge/services/policy-fingerprint.service';

describe('PolicyFingerprintService', () => {
  const service = new PolicyFingerprintService();

  it('should generate deterministic sha256 fingerprint hash and size', () => {
    const res1 = service.generateFingerprint({
      rawContent: 'Scheme Guidelines Content',
      title: 'PM Kisan Guidelines',
      sourceId: 'source-101',
    });

    const res2 = service.generateFingerprint({
      rawContent: 'Scheme Guidelines Content',
      title: 'PM Kisan Guidelines',
      sourceId: 'source-101',
    });

    expect(res1.hash).toBe(res2.hash);
    expect(res1.size).toBe(25);
  });

  it('should produce different hash for different content or title', () => {
    const res1 = service.generateFingerprint({
      rawContent: 'Scheme Guidelines Content V1',
      title: 'PM Kisan Guidelines',
      sourceId: 'source-101',
    });

    const res2 = service.generateFingerprint({
      rawContent: 'Scheme Guidelines Content V2',
      title: 'PM Kisan Guidelines',
      sourceId: 'source-101',
    });

    expect(res1.hash).not.toBe(res2.hash);
  });
});
