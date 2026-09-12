import { Injectable, Logger } from '@nestjs/common';
import { ILLMProvider } from './llm-provider.interface';
import { IEmbeddingProvider } from './embedding-provider.interface';

@Injectable()
export class GeminiLLMAdapter implements ILLMProvider, IEmbeddingProvider {
  private readonly logger = new Logger(GeminiLLMAdapter.name);

  async generateResponse(prompt: string): Promise<string> {
    this.logger.debug(`Gemini LLM response generation scaffold called for prompt: ${prompt.substring(0, 30)}...`);
    return `[Gemini LLM Scaffold Response] Echo: ${prompt}`;
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    return new Array(1536).fill(0.01);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => new Array(1536).fill(0.01));
  }
}
