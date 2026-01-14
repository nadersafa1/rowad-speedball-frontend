import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'
import { uuidSchema } from '@/lib/forms/patterns'
import { z } from 'zod'

// Query parameters for GET /championship-editions
export const championshipEditionsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    championshipId: uuidSchema.optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    sortBy: z.enum(['status', 'createdAt', 'updatedAt']).optional(),
  })
  .strict()

// Route parameters for GET /championship-editions/:id
export const championshipEditionsParamsSchema = z.object({
  id: uuidSchema,
})

// Create championship edition schema for POST /championship-editions
export const championshipEditionsCreateSchema = z
  .object({
    championshipId: uuidSchema,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    seasonId: uuidSchema,
    registrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
    registrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
  })
  .strict()
  .refine(
    (data) => {
      // If both dates are provided, end date must be after start date
      if (data.registrationStartDate && data.registrationEndDate) {
        return (
          new Date(data.registrationEndDate) >=
          new Date(data.registrationStartDate)
        )
      }
      return true
    },
    {
      message: 'Registration end date must be after start date',
      path: ['registrationEndDate'],
    }
  )

// Update championship edition schema for PATCH /championship-editions/:id
export const championshipEditionsUpdateSchema = z
  .object({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    seasonId: uuidSchema.optional(),
    registrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
    registrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If seasonId is not provided, ensure at least one other field is provided
      if (data.seasonId === undefined && Object.keys(data).length === 0) {
        return false
      }
      return true
    },
    {
      message: 'At least one field must be provided for update',
    }
  )
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type ChampionshipEditionsQuery = z.infer<
  typeof championshipEditionsQuerySchema
>
export type ChampionshipEditionsParams = z.infer<
  typeof championshipEditionsParamsSchema
>
export type ChampionshipEditionsCreate = z.infer<
  typeof championshipEditionsCreateSchema
>
export type ChampionshipEditionsUpdate = z.infer<
  typeof championshipEditionsUpdateSchema
>
