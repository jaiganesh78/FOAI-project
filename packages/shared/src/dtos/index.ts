export class PaginationQueryDto {
  page?: number = 1;
  limit?: number = 20;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export * from './document.dtos';
export * from './citizen-profile.dtos';
export * from './fact-verification.dtos';
export * from './decision-re-evaluation.dtos';
export * from './notification.dtos';
export * from './semantic.dtos';
export * from './candidate-retrieval.dtos';
