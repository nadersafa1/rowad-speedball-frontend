import { z } from 'zod'
import {
  uuidSchema,
  genderSchema,
  nonNegativeIntSchema,
} from '@/lib/forms/patterns'
import {
  standardTextSearchSchema,
  standardPaginationSchema,
  standardSortSchema,
} from '@/lib/api-helpers/query-builders'
// Query parameters for GET /results
export const resultsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    playerId: uuidSchema.optional(),
    testId: uuidSchema.optional(),
    gender: z.enum(['male', 'female', 'all']).optional(),
    ageGroup: z
      .enum([
        'mini',
        'U-09',
        'U-11',
        'U-13',
        'U-15',
        'U-17',
        'U-19',
        'U-21',
        'Seniors',
        'all',
      ])
      .optional(),
    yearOfBirth: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || (val >= 1900 && val <= 2100),
        'Year of birth must be between 1900 and 2100'
      ),
    minScore: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Minimum score must be non-negative'
      ),
    maxScore: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Maximum score must be non-negative'
      ),
    dateFrom: z
      .string()
      .optional()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format for dateFrom'
      ),
    dateTo: z
      .string()
      .optional()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format for dateTo'
      ),
    // Sorting parameters
    sortBy: z
      .enum([
        'totalScore',
        'leftHandScore',
        'rightHandScore',
        'forehandScore',
        'backhandScore',
        'playerName',
        'ageGroup',
        'age',
        'createdAt',
      ])
      .optional(),
  })
  .strict()
  .refine((data) => {
    if (data.minScore !== undefined && data.maxScore !== undefined) {
      return data.minScore <= data.maxScore
    }
    return true
  }, 'Minimum score must be less than or equal to maximum score')

// Route parameters for GET /results/:id
export const resultsParamsSchema = z.object({
  id: uuidSchema,
})

// Create result schema for POST /results
export const resultsCreateSchema = z
  .object({
    playerId: uuidSchema,
    testId: uuidSchema,
    leftHandScore: nonNegativeIntSchema('Left hand score').max(
      999,
      'Left hand score cannot exceed 999'
    ),
    rightHandScore: nonNegativeIntSchema('Right hand score').max(
      999,
      'Right hand score cannot exceed 999'
    ),
    forehandScore: nonNegativeIntSchema('Forehand score').max(
      999,
      'Forehand score cannot exceed 999'
    ),
    backhandScore: nonNegativeIntSchema('Backhand score').max(
      999,
      'Backhand score cannot exceed 999'
    ),
  })
  .strict()

// Update result schema for PATCH /results/:id
export const resultsUpdateSchema = z
  .object({
    leftHandScore: nonNegativeIntSchema('Left hand score')
      .max(999, 'Left hand score cannot exceed 999')
      .optional(),
    rightHandScore: nonNegativeIntSchema('Right hand score')
      .max(999, 'Right hand score cannot exceed 999')
      .optional(),
    forehandScore: nonNegativeIntSchema('Forehand score')
      .max(999, 'Forehand score cannot exceed 999')
      .optional(),
    backhandScore: nonNegativeIntSchema('Backhand score')
      .max(999, 'Backhand score cannot exceed 999')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Bulk create results schema for POST /results/bulk
export const resultsBulkCreateSchema = z
  .object({
    results: z
      .array(resultsCreateSchema)
      .min(1, 'At least one result must be provided')
      .max(50, 'Cannot create more than 50 results at once'),
  })
  .strict()

// Inferred TypeScript types
export type ResultsQuery = z.infer<typeof resultsQuerySchema>
export type ResultsParams = z.infer<typeof resultsParamsSchema>
export type ResultsCreate = z.infer<typeof resultsCreateSchema>
export type ResultsUpdate = z.infer<typeof resultsUpdateSchema>
export type ResultsBulkCreate = z.infer<typeof resultsBulkCreateSchema>
