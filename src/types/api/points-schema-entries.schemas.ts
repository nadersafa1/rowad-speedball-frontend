import { z } from 'zod'
import { uuidSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /points-schema-entries
export const pointsSchemaEntriesQuerySchema = z
  .object({
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z.enum(['points', 'createdAt', 'updatedAt']).optional(),
    pointsSchemaId: uuidSchema.optional(), // Filter by points schema
    placementTierId: uuidSchema.optional(), // Filter by placement tier
  })
  .strict()

// Route parameters for GET /points-schema-entries/:id
export const pointsSchemaEntriesParamsSchema = z.object({
  id: uuidSchema,
})

// Create points schema entry for POST /points-schema-entries
export const pointsSchemaEntriesCreateSchema = z
  .object({
    pointsSchemaId: uuidSchema,
    placementTierId: uuidSchema,
    points: z
      .number()
      .int('Points must be an integer')
      .min(0, 'Points must be non-negative')
      .max(10000, 'Points must be 10,000 or less'),
  })
  .strict()

// Update points schema entry for PATCH /points-schema-entries/:id
export const pointsSchemaEntriesUpdateSchema = z
  .object({
    points: z
      .number()
      .int('Points must be an integer')
      .min(0, 'Points must be non-negative')
      .max(10000, 'Points must be 10,000 or less')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type PointsSchemaEntriesQuery = z.infer<typeof pointsSchemaEntriesQuerySchema>
export type PointsSchemaEntriesParams = z.infer<typeof pointsSchemaEntriesParamsSchema>
export type PointsSchemaEntriesCreate = z.infer<typeof pointsSchemaEntriesCreateSchema>
export type PointsSchemaEntriesUpdate = z.infer<typeof pointsSchemaEntriesUpdateSchema>
