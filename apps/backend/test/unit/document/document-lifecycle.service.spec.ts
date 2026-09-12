import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentLifecycleService } from '../../../src/modules/document/services/document-lifecycle.service';
import { DocumentStatus } from '@gpios/shared';

describe('DocumentLifecycleService', () => {
  let service: DocumentLifecycleService;

  beforeEach(() => {
    service = new DocumentLifecycleService();
  });

  it('should allow valid transitions', () => {
    expect(() => service.validateTransition(DocumentStatus.UPLOADED, DocumentStatus.STORED)).not.toThrow();
    expect(() => service.validateTransition(DocumentStatus.ACTIVE, DocumentStatus.ARCHIVED)).not.toThrow();
  });

  it('should reject invalid transitions', () => {
    expect(() => service.validateTransition(DocumentStatus.UPLOADED, DocumentStatus.ACTIVE)).toThrow();
  });

  it('should restrict downstream consumption to ACTIVE status', () => {
    expect(service.canBeConsumedByDownstreamEngines(DocumentStatus.ACTIVE)).toBe(true);
    expect(service.canBeConsumedByDownstreamEngines(DocumentStatus.UPLOADED)).toBe(false);
  });
});
