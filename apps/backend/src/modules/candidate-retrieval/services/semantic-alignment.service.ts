import { Inject, Injectable, Logger } from '@nestjs/common';
import { SEMANTIC_REGISTRY_SERVICE } from '../../../core/tokens/injection-tokens';
import { SemanticRegistryService } from '../../../core/semantic/semantic-registry.service';
import { AlignedCitizenSignals, CandidateRetrievalCitizenContext } from '@gpios/shared';

@Injectable()
export class SemanticAlignmentService {
  private readonly logger = new Logger(SemanticAlignmentService.name);

  // Explicit forbidden sensitive keys that must NEVER be passed to retrieval or logged
  private readonly SENSITIVE_FACT_KEYS = new Set<string>([
    'aadhaar',
    'aadhaarnumber',
    'aadhaar_number',
    'bankaccount',
    'bankaccountnumber',
    'bank_account_number',
    'accountnumber',
    'account_number',
    'pan',
    'pannumber',
    'pan_number',
    'voterid',
    'voter_id',
    'rationcard',
    'rationcardnumber',
    'ration_card_number',
    'phone',
    'phonenumber',
    'phone_number',
    'mobile',
    'mobilenumber',
    'mobile_number',
    'email',
  ]);

  constructor(
    @Inject(SEMANTIC_REGISTRY_SERVICE)
    private readonly semanticRegistry: SemanticRegistryService,
  ) {}

  /**
   * Aligns raw citizen facts with the frozen V1 Semantic Contract.
   *
   * STRICT ARCHITECTURAL INVARIANTS (H1 TRUST BOUNDARY):
   * 1. Preserves the frozen SemanticRegistryService as the sole semantic authority.
   * 2. Authoritative citizen facts (loaded server-side from CitizenQueryService) strictly populate
   *    canonicalFacts and canonicalAttributesPresent.
   * 3. Exploratory retrieval hints are strictly isolated:
   *    - NEVER enter canonicalFacts or canonicalAttributesPresent
   *    - Cannot override authoritative server facts
   *    - Cannot cross the S12 -> S13 firewall into eligibility evaluation
   *    - Stored explicitly in exploratoryHints with exploratory provenance
   * 4. Unknown client facts, arbitrary dotted keys, or unregistered attributes fail closed into unresolvedInputs.
   * 5. Sensitive citizen identifiers (Aadhaar, PAN, bank account, phone) are stripped at ingress.
   */
  alignCitizenFacts(
    input: CandidateRetrievalCitizenContext | Record<string, unknown>,
    explicitHints?: Record<string, unknown>,
  ): AlignedCitizenSignals {
    let authFacts: Record<string, unknown> = {};
    let hintFacts: Record<string, unknown> = {};

    // Detect whether input is a structured CandidateRetrievalCitizenContext or a raw facts dictionary
    if (input && typeof input === 'object') {
      const hasAuth = Object.prototype.hasOwnProperty.call(input, 'authoritativeCitizenFacts');
      const hasHints = Object.prototype.hasOwnProperty.call(input, 'retrievalHints');
      const hasFacts = Object.prototype.hasOwnProperty.call(input, 'facts');

      if (hasAuth || hasHints) {
        authFacts = (input.authoritativeCitizenFacts as Record<string, unknown>) || {};
        hintFacts = (input.retrievalHints as Record<string, unknown>) || {};
        if (!hasAuth && hasFacts) {
          authFacts = (input.facts as Record<string, unknown>) || {};
        }
      } else if (hasFacts) {
        authFacts = (input.facts as Record<string, unknown>) || {};
        hintFacts = explicitHints || {};
      } else {
        authFacts = input as unknown as Record<string, unknown>;
        hintFacts = explicitHints || {};
      }
    } else {
      authFacts = {};
      hintFacts = explicitHints || {};
    }

    this.logger.debug(
      `Aligning citizen context: ${Object.keys(authFacts).length} authoritative facts, ${Object.keys(hintFacts).length} hints`,
    );

    const canonicalFacts: Record<string, unknown> = {};
    const canonicalAttributesPresent: string[] = [];
    const exploratoryHints: Record<string, unknown> = {};
    const exploratoryAttributeCodes: string[] = [];
    const factProvenance: Record<string, 'AUTHORITATIVE' | 'EXPLORATORY_HINT'> = {};
    const unresolvedInputs: string[] = [];
    const ambiguousInputs: string[] = [];

    let state: string | undefined;
    let socialCategory: string | undefined;
    let ewsStatus: boolean | undefined;
    let beneficiaryCategory: string | undefined;
    let primaryOccupation: string | undefined;
    let landHoldingHectares: number | undefined;
    let annualIncomeInr: number | undefined;
    let ageYears: number | undefined;
    let gender: string | undefined;

    let exploratoryState: string | undefined;
    let exploratoryBeneficiaryCategory: string | undefined;
    let exploratoryPrimaryOccupation: string | undefined;
    let exploratoryAgeYears: number | undefined;

    // -------------------------------------------------------------------------
    // 1. Process Authoritative Citizen Facts (Trusted Server Path)
    // -------------------------------------------------------------------------
    for (const [key, rawValue] of Object.entries(authFacts)) {
      if (rawValue === null || rawValue === undefined) {
        continue;
      }

      // Security check: purge sensitive identifiers
      const normalizedKey = key.trim().toLowerCase().replace(/[-_]/g, '');
      if (this.SENSITIVE_FACT_KEYS.has(normalizedKey)) {
        this.logger.debug(`Purged sensitive identifier from authoritative facts: [REDACTED_KEY]`);
        continue;
      }

      // Check if key matches or bridges to a canonical attribute in the frozen registry
      let canonicalAttr = this.semanticRegistry.getCanonicalAttribute(key);
      if (!canonicalAttr) {
        if (normalizedKey === 'occupation' || normalizedKey === 'primaryoccupation') {
          canonicalAttr = this.semanticRegistry.getCanonicalAttribute('occupationCategory');
        } else if (normalizedKey === 'disability' || normalizedKey === 'disabilitystatus') {
          canonicalAttr = this.semanticRegistry.getCanonicalAttribute('isPersonWithDisability');
        }
      }

      if (canonicalAttr) {
        const resolution = this.semanticRegistry.resolveCanonicalValue(canonicalAttr.code, rawValue);

        if (resolution.resolved && resolution.canonicalValue !== undefined) {
          canonicalFacts[canonicalAttr.code] = resolution.canonicalValue;
          if (!canonicalAttributesPresent.includes(canonicalAttr.code)) {
            canonicalAttributesPresent.push(canonicalAttr.code);
          }
          factProvenance[canonicalAttr.code] = 'AUTHORITATIVE';

          // Populate authoritative typed fields
          switch (canonicalAttr.code) {
            case 'COMMUNITY.SOCIAL_CATEGORY':
              socialCategory = String(resolution.canonicalValue);
              factProvenance['socialCategory'] = 'AUTHORITATIVE';
              break;

            case 'ECONOMIC.EWS_STATUS':
              ewsStatus = Boolean(resolution.canonicalValue);
              factProvenance['ewsStatus'] = 'AUTHORITATIVE';
              break;

            case 'OCCUPATION.CATEGORY':
              primaryOccupation = String(resolution.canonicalValue);
              factProvenance['primaryOccupation'] = 'AUTHORITATIVE';
              break;

            case 'AGRICULTURE.LAND_AREA':
              if (typeof resolution.canonicalValue === 'number' && Number.isFinite(resolution.canonicalValue)) {
                landHoldingHectares = resolution.canonicalValue;
                factProvenance['landHoldingHectares'] = 'AUTHORITATIVE';
              }
              break;

            case 'FINANCIAL.ANNUAL_INCOME':
              if (typeof resolution.canonicalValue === 'number' && Number.isFinite(resolution.canonicalValue)) {
                annualIncomeInr = resolution.canonicalValue;
                factProvenance['annualIncomeInr'] = 'AUTHORITATIVE';
              }
              break;

            case 'DEMOGRAPHICS.GENDER':
              gender = String(resolution.canonicalValue);
              factProvenance['gender'] = 'AUTHORITATIVE';
              break;

            case 'DEMOGRAPHICS.DOB':
              if (ageYears === undefined && resolution.canonicalValue) {
                const dob = resolution.canonicalValue instanceof Date
                  ? resolution.canonicalValue
                  : new Date(String(resolution.canonicalValue));
                if (!isNaN(dob.getTime())) {
                  const ageDiffMs = Date.now() - dob.getTime();
                  const ageDate = new Date(ageDiffMs);
                  ageYears = Math.abs(ageDate.getUTCFullYear() - 1970);
                  factProvenance['ageYears'] = 'AUTHORITATIVE';
                }
              }
              break;
          }
        } else {
          const safeVal = this.sanitizeValueForAudit(rawValue);
          if (resolution.reason === 'CONTEXT_REQUIRED') {
            unresolvedInputs.push(`${key}:${safeVal}`);
          } else if (resolution.reason === 'AMBIGUOUS_ALIAS') {
            ambiguousInputs.push(`${key}:${safeVal}`);
          } else {
            unresolvedInputs.push(`${key}:${safeVal}`);
          }
        }
      } else {
        // Recognized safe retrieval-context metadata fields
        if (normalizedKey === 'state' || normalizedKey === 'residencestate') {
          state = String(rawValue);
          factProvenance['state'] = 'AUTHORITATIVE';
        } else if (normalizedKey === 'beneficiarycategory') {
          beneficiaryCategory = String(rawValue);
          factProvenance['beneficiaryCategory'] = 'AUTHORITATIVE';
        } else if (normalizedKey === 'age' || normalizedKey === 'ageyears') {
          const num = Number(rawValue);
          if (Number.isFinite(num) && num >= 0 && num <= 130) {
            ageYears = num;
            factProvenance['ageYears'] = 'AUTHORITATIVE';
          } else {
            unresolvedInputs.push(`${key}:${this.sanitizeValueForAudit(rawValue)}`);
          }
        } else {
          // Unknown attribute fails closed
          unresolvedInputs.push(`${key}:${this.sanitizeValueForAudit(rawValue)}`);
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. Process Exploratory Retrieval Hints (Non-Authoritative Path)
    // -------------------------------------------------------------------------
    for (const [key, rawValue] of Object.entries(hintFacts)) {
      if (rawValue === null || rawValue === undefined) {
        continue;
      }

      // Security check: purge sensitive identifiers from hints
      const normalizedKey = key.trim().toLowerCase().replace(/[-_]/g, '');
      if (this.SENSITIVE_FACT_KEYS.has(normalizedKey)) {
        this.logger.debug(`Purged sensitive identifier from retrieval hints: [REDACTED_KEY]`);
        continue;
      }

      // Check if key matches or bridges to a canonical attribute in frozen registry
      let canonicalAttr = this.semanticRegistry.getCanonicalAttribute(key);
      if (!canonicalAttr) {
        if (normalizedKey === 'occupation' || normalizedKey === 'primaryoccupation') {
          canonicalAttr = this.semanticRegistry.getCanonicalAttribute('occupationCategory');
        } else if (normalizedKey === 'disability' || normalizedKey === 'disabilitystatus') {
          canonicalAttr = this.semanticRegistry.getCanonicalAttribute('isPersonWithDisability');
        }
      }

      if (canonicalAttr) {
        // CASE B: Conflicting client fact where authoritative fact already exists.
        // Server fact takes strict precedence: hint CANNOT overwrite authoritative value.
        if (canonicalFacts[canonicalAttr.code] !== undefined) {
          this.logger.debug(
            `Ignored conflicting retrieval hint for ${canonicalAttr.code}: server authoritative fact retained`,
          );
          continue;
        }

        // CASE C: Registered client fact absent from server profile.
        // Resolve against frozen registry, but strictly tag as EXPLORATORY HINT.
        // It NEVER enters canonicalFacts or canonicalAttributesPresent!
        const resolution = this.semanticRegistry.resolveCanonicalValue(canonicalAttr.code, rawValue);

        if (resolution.resolved && resolution.canonicalValue !== undefined) {
          exploratoryHints[canonicalAttr.code] = resolution.canonicalValue;
          if (!exploratoryAttributeCodes.includes(canonicalAttr.code)) {
            exploratoryAttributeCodes.push(canonicalAttr.code);
          }
          factProvenance[canonicalAttr.code] = 'EXPLORATORY_HINT';

          if (canonicalAttr.code === 'OCCUPATION.CATEGORY') {
            exploratoryPrimaryOccupation = String(resolution.canonicalValue);
            if (!factProvenance['primaryOccupation']) {
              factProvenance['primaryOccupation'] = 'EXPLORATORY_HINT';
            }
          }
        } else {
          const safeVal = this.sanitizeValueForAudit(rawValue);
          if (resolution.reason === 'CONTEXT_REQUIRED') {
            unresolvedInputs.push(`${key}:${safeVal}`);
          } else if (resolution.reason === 'AMBIGUOUS_ALIAS') {
            ambiguousInputs.push(`${key}:${safeVal}`);
          } else {
            unresolvedInputs.push(`${key}:${safeVal}`);
          }
        }
      } else {
        // Check recognized safe metadata hints
        if (normalizedKey === 'state' || normalizedKey === 'residencestate') {
          if (state === undefined) {
            exploratoryState = String(rawValue);
            if (!factProvenance['state']) {
              factProvenance['state'] = 'EXPLORATORY_HINT';
            }
          }
        } else if (normalizedKey === 'beneficiarycategory') {
          if (beneficiaryCategory === undefined) {
            exploratoryBeneficiaryCategory = String(rawValue);
            if (!factProvenance['beneficiaryCategory']) {
              factProvenance['beneficiaryCategory'] = 'EXPLORATORY_HINT';
            }
          }
        } else if (normalizedKey === 'age' || normalizedKey === 'ageyears') {
          if (ageYears === undefined) {
            const num = Number(rawValue);
            if (Number.isFinite(num) && num >= 0 && num <= 130) {
              exploratoryAgeYears = num;
              if (!factProvenance['ageYears']) {
                factProvenance['ageYears'] = 'EXPLORATORY_HINT';
              }
            } else {
              unresolvedInputs.push(`${key}:${this.sanitizeValueForAudit(rawValue)}`);
            }
          }
        } else {
          // CASE A: Unknown client fact or arbitrary dotted key fails closed.
          // NEVER enters canonicalFacts, NEVER enters exploratoryHints.
          unresolvedInputs.push(`${key}:${this.sanitizeValueForAudit(rawValue)}`);
        }
      }
    }

    return {
      state,
      socialCategory,
      ewsStatus,
      beneficiaryCategory,
      primaryOccupation,
      landHoldingHectares,
      annualIncomeInr,
      ageYears,
      gender,
      canonicalFacts,
      canonicalAttributesPresent,
      exploratoryHints,
      exploratoryAttributeCodes,
      exploratoryState,
      exploratoryBeneficiaryCategory,
      exploratoryPrimaryOccupation,
      exploratoryAgeYears,
      factProvenance,
      unresolvedInputs,
      ambiguousInputs,
    };
  }

  /**
   * Redacts sensitive patterns (Aadhaar, PAN, Bank accounts / long digits)
   * from values entering audit/unresolved tracking to prevent PII leakage.
   */
  private sanitizeValueForAudit(value: unknown): string {
    const str = String(value);
    return str
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{12}\b/g, '[REDACTED_IDENTIFIER]')
      .replace(/\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g, '[REDACTED_IDENTIFIER]')
      .replace(/\b\d{9,18}\b/g, '[REDACTED_IDENTIFIER]');
  }
}
