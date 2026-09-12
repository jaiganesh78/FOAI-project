export interface ILLMProvider {
  generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string>;
}
