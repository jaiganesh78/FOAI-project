import { Global, Module } from '@nestjs/common';
import { LLM_PROVIDER, EMBEDDING_PROVIDER } from '../tokens/injection-tokens';
import { GeminiLLMAdapter } from './gemini-llm.adapter';

@Global()
@Module({
  providers: [
    GeminiLLMAdapter,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiLLMAdapter,
    },
    {
      provide: EMBEDDING_PROVIDER,
      useExisting: GeminiLLMAdapter,
    },
  ],
  exports: [LLM_PROVIDER, EMBEDDING_PROVIDER, GeminiLLMAdapter],
})
export class AIProviderModule {}
