import { z } from 'zod'

// Session type enum values
const sessionTypeEnum = z.enum([
  'singles',
  'men_doubles',
  'women_doubles',
  'mixed_doubles',
  'solo',
  'relay',
])

// Age group enum values
const ageGroupEnum = z.enum([
  'mini',
  'U-09',
  'U-11',
  'U-13',
  'U-15',
  'U-17',
  'U-19',
  'U-21',
  'Seniors',
])

// Query parameters for GET /training-sessions
export const trainingSessionsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(20, 'q must be less than 20 characters')
      .optional(),
    intensity: z.enum(['high', 'normal', 'low', 'all']).optional(),
    type: sessionTypeEnum.optional(),
    dateFrom: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    dateTo: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    ageGroup: ageGroupEnum.optional(),
    // Sorting parameters
    sortBy: z
      .enum(['name', 'intensity', 'date', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    // Pagination parameters
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine(
        (val) => val >= 1 && val <= 100,
        'Limit must be between 1 and 100'
      ),
  })
  .strict()

// Route parameters for GET /training-sessions/:id
export const trainingSessionsParamsSchema = z.object({
  id: z.uuid('Invalid training session ID format'),
})

// Create training session schema for POST /training-sessions
export const trainingSessionsCreateSchema = z
  .object({
    name: z.string().max(255, 'Name is too long').optional(),
    intensity: z
      .enum(['high', 'normal', 'low'], {
        message: 'Intensity must be high, normal, or low',
      })
      .optional(),
    type: z.array(sessionTypeEnum).min(1, 'At least one type is required'),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
    description: z.string().optional(),
    ageGroups: z
      .array(ageGroupEnum)
      .min(1, 'At least one age group is required'),
    coachIds: z.array(z.uuid()).optional(),
  })
  .strict()

// Update training session schema for PATCH /training-sessions/:id
export const trainingSessionsUpdateSchema = z
  .object({
    name: z.string().max(255, 'Name is too long').optional(),
    intensity: z
      .enum(['high', 'normal', 'low'], {
        message: 'Intensity must be high, normal, or low',
      })
      .optional(),
    type: z.array(sessionTypeEnum).optional(),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    description: z.string().optional().nullable(),
    ageGroups: z.array(ageGroupEnum).optional(),
    coachIds: z.array(z.uuid()).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type TrainingSessionsQuery = z.infer<
  typeof trainingSessionsQuerySchema
>
export type TrainingSessionsParams = z.infer<
  typeof trainingSessionsParamsSchema
>
export type TrainingSessionsCreate = z.infer<
  typeof trainingSessionsCreateSchema
>
export type TrainingSessionsUpdate = z.infer<
  typeof trainingSessionsUpdateSchema
>

