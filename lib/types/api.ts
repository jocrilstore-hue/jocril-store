/**
 * API-related types
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API error with additional metadata
 */
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Common filter params
 */
export interface BaseFilterParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}
