import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AIProviderModule } from '../../core/ai-provider/ai-provider.module';
import {
  CANDIDATE_RETRIEVAL_REPOSITORY,
  CANDIDATE_RETRIEVAL_SERVICE,
  SEMANTIC_ALIGNMENT_SERVICE,
  VECTOR_SEARCH_PROVIDER,
} from '../../core/tokens/injection-tokens';
import { PrismaCandidateRetrievalRepository } from './repositories/prisma-candidate-retrieval.repository';
import { SemanticAlignmentService } from './services/semantic-alignment.service';
import { CandidateRetrievalService } from './services/candidate-retrieval.service';
import { DeterministicVectorTestAdapter } from './adapters/deterministic-vector-test.adapter';
import { CandidateRetrievalController } from './controllers/candidate-retrieval.controller';

import { AuthModule } from '../auth/auth.module';
import { CitizenModule } from '../citizen/citizen.module';

@Module({
  imports: [DatabaseModule, AIProviderModule, AuthModule, CitizenModule],
  controllers: [CandidateRetrievalController],
  providers: [
    PrismaCandidateRetrievalRepository,
    SemanticAlignmentService,
    DeterministicVectorTestAdapter,
    CandidateRetrievalService,
    {
      provide: CANDIDATE_RETRIEVAL_REPOSITORY,
      useExisting: PrismaCandidateRetrievalRepository,
    },
    {
      provide: SEMANTIC_ALIGNMENT_SERVICE,
      useExisting: SemanticAlignmentService,
    },
    {
      provide: VECTOR_SEARCH_PROVIDER,
      useExisting: DeterministicVectorTestAdapter,
    },
    {
      provide: CANDIDATE_RETRIEVAL_SERVICE,
      useExisting: CandidateRetrievalService,
    },
  ],
  exports: [
    CANDIDATE_RETRIEVAL_REPOSITORY,
    CANDIDATE_RETRIEVAL_SERVICE,
    SEMANTIC_ALIGNMENT_SERVICE,
    VECTOR_SEARCH_PROVIDER,
    PrismaCandidateRetrievalRepository,
    SemanticAlignmentService,
    DeterministicVectorTestAdapter,
    CandidateRetrievalService,
  ],
})
export class CandidateRetrievalModule {}
