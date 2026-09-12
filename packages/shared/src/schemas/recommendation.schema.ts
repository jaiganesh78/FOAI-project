import { z } from 'zod';
import { RecommendationFeedbackAction } from '../enums/recommendation.enum';

export const generateRecommendationSchema = z.object({
  userId: z.string().uuid({ message: 'Valid User ID UUID is required' }).optional(),
  strategyId: z.string().optional().default('UTILITY_DEFAULT'),
  forceRefresh: z.boolean().optional().default(false),
});

export const updateRecommendationPreferenceSchema = z.object({
  preferredCategories: z.array(z.string()).min(1, { message: 'At least one preferred category is required' }),
  maxDifficultyTolerance: z.number().min(1).max(5).optional(),
  prioritizeMonetaryValue: z.boolean().optional(),
  prioritizeUrgency: z.boolean().optional(),
});

export const submitRecommendationFeedbackSchema = z.object({
  recommendationId: z.string().uuid({ message: 'Valid Recommendation ID is required' }),
  action: z.nativeEnum(RecommendationFeedbackAction),
  metadata: z.record(z.unknown()).optional(),
});

export type GenerateRecommendationInput = z.infer<typeof generateRecommendationSchema>;
export type UpdateRecommendationPreferenceInput = z.infer<typeof updateRecommendationPreferenceSchema>;
export type SubmitRecommendationFeedbackInput = z.infer<typeof submitRecommendationFeedbackSchema>;
