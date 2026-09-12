import { describe, it, expect } from 'vitest';
import { PolicyValidationService } from '../../../src/modules/eligibility/services/policy-validation.service';

describe('PolicyValidationService', () => {
  const service = new PolicyValidationService();

  it('should validate policy for activation when all fields are present', () => {
    const doc = { id: 'doc-1', documentNumber: 'DOC-001', title: 'PM Kisan' } as any;
    const ver = { id: 'ver-1', fingerprintHash: 'hash123' } as any;

    const res = service.validatePolicyForActivation(doc, ver);

    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('should return errors if policy version or fingerprint hash is missing', () => {
    const doc = { id: 'doc-1', documentNumber: 'DOC-001', title: 'PM Kisan' } as any;

    const res = service.validatePolicyForActivation(doc, null);

    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Current policy version is missing.');
  });
});
