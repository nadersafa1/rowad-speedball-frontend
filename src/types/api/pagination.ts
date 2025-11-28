import { z } from 'zod'

// Pagination query parameters
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
})

// Pagination parameters interface
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

// Players stats interface
export interface PlayersStats {
  maleCount: number
  femaleCount: number
  ageGroupsCount: number
}

// Coaches stats interface
export interface CoachesStats {
  maleCount: number
  femaleCount: number
}

// Tests stats interface
export interface TestsStats {
  totalCount: number
  publicCount: number
  privateCount: number
}

// Events stats interface
export interface EventsStats {
  totalCount: number
  publicCount: number
  privateCount: number
  completedCount: number
}

// Training Sessions stats interface
export interface TrainingSessionsStats {
  totalCount: number
  highIntensityCount: number
  normalIntensityCount: number
  lowIntensityCount: number
}

// Paginated response interface
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
  stats?:
    | PlayersStats
    | CoachesStats
    | TestsStats
    | EventsStats
    | TrainingSessionsStats
}

// Pagination metadata
export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

// Helper function to calculate pagination parameters
export const calculatePagination = (
  page: number,
  limit: number
): PaginationParams => {
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

// Helper function to create paginated response
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(totalItems / limit)

  return {
    data,
    page,
    limit,
    totalItems,
    totalPages,
  }
}

// Inferred TypeScript types
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
