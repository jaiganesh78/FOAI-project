import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const aiConfigSchema = z.object({
  geminiApiKey: z.string().default('placeholder_gemini_key'),
  langfusePublicKey: z.string().default('placeholder_langfuse_public'),
  langfuseSecretKey: z.string().default('placeholder_langfuse_secret'),
  langfuseHost: z.string().default('https://cloud.langfuse.com'),
});

export type AIConfigType = z.infer<typeof aiConfigSchema>;

export const aiConfig = registerAs('ai', (): AIConfigType => {
  return aiConfigSchema.parse({
    geminiApiKey: process.env.GEMINI_API_KEY,
    langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY,
    langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY,
    langfuseHost: process.env.LANGFUSE_HOST,
  });
});
