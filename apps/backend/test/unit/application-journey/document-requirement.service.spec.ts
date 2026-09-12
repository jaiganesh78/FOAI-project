import { describe, it, expect } from 'vitest';
import { DocumentRequirementService } from '../../../src/modules/application-journey/services/document-requirement.service';

describe('DocumentRequirementService', () => {
  const service = new DocumentRequirementService();

  it('should return required document constraints for policy', () => {
    const docs = service.getDocumentRequirementsForPolicy('pol-1');
    expect(docs.length).toBe(2);
    expect(docs[0].documentType).toBe('IDENTITY_PROOF');
  });
});
