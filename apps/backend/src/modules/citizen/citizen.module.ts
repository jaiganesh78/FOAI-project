import { Module } from '@nestjs/common';
import { CitizenController } from './controllers/citizen.controller';
import { CitizenKnowledgeProfileController } from './controllers/citizen-knowledge-profile.controller';
import { CitizenProfileService } from './services/citizen-profile.service';
import { CitizenFactService } from './services/citizen-fact.service';
import { AttributeValidationEngine } from './services/attribute-validation.engine';
import { CitizenCompletenessEngine } from './services/citizen-completeness.engine';
import { CitizenSnapshotService } from './services/citizen-snapshot.service';
import { CitizenQueryService } from './services/citizen-query.service';
import { CitizenKnowledgeProfileService } from './services/citizen-knowledge-profile.service';
import { FactSourcePrecedencePolicy } from './services/fact-source-precedence.policy';
import { FactVersionService } from './services/fact-version.service';
import { FactFreshnessEngineService } from './services/fact-freshness-engine.service';
import { ProfileCompletenessEngineService } from './services/profile-completeness-engine.service';
import { ProfileSnapshotReplayService } from './services/profile-snapshot-replay.service';
import { ChangeImpactEngineService } from './services/change-impact-engine.service';

import { PrismaCitizenProfileRepository } from './repositories/prisma-citizen-profile.repository';
import { PrismaCitizenFactRepository } from './repositories/prisma-citizen-fact.repository';
import { PrismaCitizenAttributeRegistryRepository } from './repositories/prisma-citizen-attribute-registry.repository';
import { PrismaProfileVersionRepository } from './repositories/prisma-profile-version.repository';
import { PrismaEvidenceRepository } from './repositories/prisma-evidence.repository';
import { PrismaCitizenKnowledgeProfileRepository } from './repositories/prisma-citizen-knowledge-profile.repository';

import { AuthModule } from '../auth/auth.module';
import {
  CITIZEN_PROFILE_REPOSITORY,
  CITIZEN_FACT_REPOSITORY,
  CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY,
  PROFILE_VERSION_REPOSITORY,
  EVIDENCE_REPOSITORY,
  ATTRIBUTE_VALIDATION_ENGINE,
  COMPLETENESS_ENGINE,
  SNAPSHOT_SERVICE,
  CITIZEN_QUERY_SERVICE,
  CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY,
  CITIZEN_KNOWLEDGE_PROFILE_SERVICE,
  FACT_SOURCE_PRECEDENCE_POLICY,
  FACT_VERSION_SERVICE,
  FACT_FRESHNESS_ENGINE_SERVICE,
  PROFILE_COMPLETENESS_ENGINE_SERVICE,
  PROFILE_SNAPSHOT_REPLAY_SERVICE,
  CHANGE_IMPACT_ENGINE_SERVICE,
} from '../../core/tokens/injection-tokens';

@Module({
  imports: [AuthModule],
  controllers: [CitizenController, CitizenKnowledgeProfileController],
  providers: [
    AttributeValidationEngine,
    CitizenCompletenessEngine,
    CitizenSnapshotService,
    CitizenProfileService,
    CitizenFactService,
    CitizenQueryService,
    CitizenKnowledgeProfileService,
    FactSourcePrecedencePolicy,
    FactVersionService,
    FactFreshnessEngineService,
    ProfileCompletenessEngineService,
    ProfileSnapshotReplayService,
    ChangeImpactEngineService,
    {
      provide: CITIZEN_PROFILE_REPOSITORY,
      useClass: PrismaCitizenProfileRepository,
    },
    {
      provide: CITIZEN_FACT_REPOSITORY,
      useClass: PrismaCitizenFactRepository,
    },
    {
      provide: CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY,
      useClass: PrismaCitizenAttributeRegistryRepository,
    },
    {
      provide: PROFILE_VERSION_REPOSITORY,
      useClass: PrismaProfileVersionRepository,
    },
    {
      provide: EVIDENCE_REPOSITORY,
      useClass: PrismaEvidenceRepository,
    },
    {
      provide: ATTRIBUTE_VALIDATION_ENGINE,
      useClass: AttributeValidationEngine,
    },
    {
      provide: COMPLETENESS_ENGINE,
      useClass: CitizenCompletenessEngine,
    },
    {
      provide: SNAPSHOT_SERVICE,
      useClass: CitizenSnapshotService,
    },
    {
      provide: CITIZEN_QUERY_SERVICE,
      useClass: CitizenQueryService,
    },
    {
      provide: CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY,
      useClass: PrismaCitizenKnowledgeProfileRepository,
    },
    {
      provide: CITIZEN_KNOWLEDGE_PROFILE_SERVICE,
      useClass: CitizenKnowledgeProfileService,
    },
    {
      provide: FACT_SOURCE_PRECEDENCE_POLICY,
      useClass: FactSourcePrecedencePolicy,
    },
    {
      provide: FACT_VERSION_SERVICE,
      useClass: FactVersionService,
    },
    {
      provide: FACT_FRESHNESS_ENGINE_SERVICE,
      useClass: FactFreshnessEngineService,
    },
    {
      provide: PROFILE_COMPLETENESS_ENGINE_SERVICE,
      useClass: ProfileCompletenessEngineService,
    },
    {
      provide: PROFILE_SNAPSHOT_REPLAY_SERVICE,
      useClass: ProfileSnapshotReplayService,
    },
    {
      provide: CHANGE_IMPACT_ENGINE_SERVICE,
      useClass: ChangeImpactEngineService,
    },
  ],
  exports: [
    CitizenQueryService,
    CitizenProfileService,
    CitizenFactService,
    CitizenKnowledgeProfileService,
    FactSourcePrecedencePolicy,
    FactVersionService,
    FactFreshnessEngineService,
    ProfileCompletenessEngineService,
    ProfileSnapshotReplayService,
    ChangeImpactEngineService,
    CITIZEN_QUERY_SERVICE,
    CITIZEN_PROFILE_REPOSITORY,
    CITIZEN_FACT_REPOSITORY,
    CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY,
    CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY,
    CITIZEN_KNOWLEDGE_PROFILE_SERVICE,
    FACT_SOURCE_PRECEDENCE_POLICY,
    FACT_VERSION_SERVICE,
    FACT_FRESHNESS_ENGINE_SERVICE,
    PROFILE_COMPLETENESS_ENGINE_SERVICE,
    PROFILE_SNAPSHOT_REPLAY_SERVICE,
    CHANGE_IMPACT_ENGINE_SERVICE,
  ],
})
export class CitizenModule {}
