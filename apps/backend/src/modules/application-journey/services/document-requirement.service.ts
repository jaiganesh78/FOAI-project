import { Injectable } from '@nestjs/common';
import { DocumentRequirementDto, DocumentRequirementStatus } from '@gpios/shared';

@Injectable()
export class DocumentRequirementService {
  getDocumentRequirementsForPolicy(policyId: string): DocumentRequirementDto[] {
    return [
      {
        id: `doc-req-1-${policyId}`,
        documentType: 'IDENTITY_PROOF',
        title: 'Aadhaar Identity Proof',
        isMandatory: true,
        acceptedFormats: ['pdf', 'jpeg', 'png'],
        maxAgeDays: 365,
        maxSizeBytes: 5242880,
        issuingAuthority: 'UIDAI',
        requiresVerification: true,
        status: DocumentRequirementStatus.REQUIRED,
      },
      {
        id: `doc-req-2-${policyId}`,
        documentType: 'LAND_OWNERSHIP',
        title: 'Patta / Land Records',
        isMandatory: true,
        acceptedFormats: ['pdf'],
        maxAgeDays: 730,
        maxSizeBytes: 10485760,
        issuingAuthority: 'State Revenue Department',
        requiresVerification: true,
        status: DocumentRequirementStatus.REQUIRED,
      },
    ];
  }
}
