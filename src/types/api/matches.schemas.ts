import { z } from 'zod'
import { uuidSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /matches
export const matchesQuerySchema = z
  .object({
    eventId: uuidSchema.optional(),
    groupId: uuidSchema.optional(),
    round: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => !val || val >= 1, 'Round must be greater than 0'),
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z
      .enum(['round', 'matchNumber', 'matchDate', 'played', 'createdAt', 'updatedAt'])
      .optional(),
  })
  .strict()

// Route parameters for GET /matches/:id
export const matchesParamsSchema = z.object({
  id: uuidSchema,
})

// Update match schema for PATCH /matches/:id
export const matchesUpdateSchema = z
  .object({
    played: z.boolean().optional(),
    winnerId: uuidSchema.nullable().optional(),
    matchDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type MatchesQuery = z.infer<typeof matchesQuerySchema>
export type MatchesParams = z.infer<typeof matchesParamsSchema>
export type MatchesUpdate = z.infer<typeof matchesUpdateSchema>
