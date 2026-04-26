export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export type Tier = 'free' | 'premium';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
