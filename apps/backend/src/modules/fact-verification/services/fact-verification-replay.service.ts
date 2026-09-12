import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  FACT_VERIFICATION_REPOSITORY,
  FACT_VERIFICATION_POLICY_ENGINE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IFactVerificationRepository } from '../repositories/fact-verification.repository.interface';
import { FactVerificationPolicyEngineService } from './fact-verification-policy-engine.service';
import { FactVerificationSnapshotDto, FactFreshnessStatus } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class FactVerificationReplayService {
  constructor(
    @Inject(FACT_VERIFICATION_REPOSITORY) private readonly repo: IFactVerificationRepository,
    @Inject(FACT_VERIFICATION_POLICY_ENGINE_SERVICE) private readonly policyEngine: FactVerificationPolicyEngineService,
  ) {}

  computeSnapshotChecksum(snapshotData: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(snapshotData)).digest('hex');
  }

  async createSnapshot(data: {
    verificationRunId: string;
    citizenId: string;
    factId: string;
    canonicalValue: unknown;
    canonicalSource: string;
    freshnessStatus: string;
    policyId: string;
    policyVersion: number;
    policyConfiguration: Record<string, unknown>;
    policyChecksumSha256: string;
  }): Promise<FactVerificationSnapshotDto> {
    const payload = {
      verificationRunId: data.verificationRunId,
      citizenId: data.citizenId,
      factId: data.factId,
      canonicalValue: data.canonicalValue,
      canonicalSource: data.canonicalSource,
      freshnessStatus: data.freshnessStatus,
      policyId: data.policyId,
      policyVersion: data.policyVersion,
      policyConfiguration: data.policyConfiguration,
      policyChecksumSha256: data.policyChecksumSha256,
    };

    const checksumSha256 = this.computeSnapshotChecksum(payload);

    const snapshot = await this.repo.createSnapshot({
      verificationRunId: data.verificationRunId,
      citizenId: data.citizenId,
      factId: data.factId,
      canonicalValue: data.canonicalValue,
      canonicalSource: data.canonicalSource,
      freshnessStatus: data.freshnessStatus,
      policyId: data.policyId,
      policyVersion: data.policyVersion,
      policyConfiguration: data.policyConfiguration,
      policyChecksumSha256: data.policyChecksumSha256,
      checksumSha256,
    });

    return {
      snapshotId: snapshot.id,
      verificationRunId: snapshot.verificationRunId,
      citizenId: snapshot.citizenId,
      factId: snapshot.factId,
      canonicalValue: snapshot.canonicalValue,
      canonicalSource: snapshot.canonicalSource,
      freshnessStatus: snapshot.freshnessStatus as FactFreshnessStatus,
      policyId: snapshot.policyId,
      policyVersion: snapshot.policyVersion,
      policyConfiguration: (snapshot.policyConfiguration as Record<string, unknown>) || {},
      policyChecksumSha256: snapshot.policyChecksumSha256,
      checksumSha256: snapshot.checksumSha256,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  async replayVerification(verificationRunId: string): Promise<{
    isVerified: boolean;
    replayedPolicyVersion: number;
    snapshot: FactVerificationSnapshotDto;
  }> {
    const run = await this.repo.getRunById(verificationRunId);
    if (!run) {
      throw new BadRequestException(`Verification Run '${verificationRunId}' not found.`);
    }

    const snapshot = await this.repo.getSnapshotByRun(verificationRunId);
    if (!snapshot) {
      throw new BadRequestException(`Snapshot for verification run '${verificationRunId}' not found.`);
    }

    // MANDATORY HARDENING RULE: Load policy by recorded policyVersion in run, NOT current active policy!
    const recordedPolicy = await this.policyEngine.getPolicyByVersion(run.attributeKey, run.policyVersion);

    // Check policy checksum integrity
    if (recordedPolicy.checksumSha256 !== run.policyChecksumSha256) {
      throw new BadRequestException(
        `LOUD POLICY REPLAY FAILURE: Policy checksum mismatch for run '${verificationRunId}'! Recorded ${run.policyChecksumSha256}, calculated ${recordedPolicy.checksumSha256}. Policy tamper detected.`,
      );
    }

    // Check snapshot checksum integrity
    const payload: Record<string, unknown> = {
      verificationRunId: snapshot.verificationRunId,
      citizenId: snapshot.citizenId,
      factId: snapshot.factId,
      canonicalValue: snapshot.canonicalValue,
      canonicalSource: snapshot.canonicalSource,
      freshnessStatus: snapshot.freshnessStatus,
      policyId: snapshot.policyId,
      policyVersion: snapshot.policyVersion,
      policyConfiguration: snapshot.policyConfiguration,
      policyChecksumSha256: snapshot.policyChecksumSha256,
    };

    const calculatedChecksum = this.computeSnapshotChecksum(payload);
    if (calculatedChecksum !== snapshot.checksumSha256) {
      throw new BadRequestException(
        `LOUD SNAPSHOT REPLAY FAILURE: Verification snapshot checksum mismatch! Expected ${snapshot.checksumSha256}, calculated ${calculatedChecksum}. Snapshot integrity corrupted.`,
      );
    }

    return {
      isVerified: true,
      replayedPolicyVersion: run.policyVersion,
      snapshot: {
        snapshotId: snapshot.id,
        verificationRunId: snapshot.verificationRunId,
        citizenId: snapshot.citizenId,
        factId: snapshot.factId,
        canonicalValue: snapshot.canonicalValue,
        canonicalSource: snapshot.canonicalSource,
        freshnessStatus: snapshot.freshnessStatus as FactFreshnessStatus,
        policyId: snapshot.policyId,
        policyVersion: snapshot.policyVersion,
        policyConfiguration: (snapshot.policyConfiguration as Record<string, unknown>) || {},
        policyChecksumSha256: snapshot.policyChecksumSha256,
        checksumSha256: snapshot.checksumSha256,
        createdAt: snapshot.createdAt.toISOString(),
      },
    };
  }
}
