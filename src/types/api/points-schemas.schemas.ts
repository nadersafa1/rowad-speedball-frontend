import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /points-schemas
export const pointsSchemasQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  })
  .strict()

// Route parameters for GET /points-schemas/:id
export const pointsSchemasParamsSchema = z.object({
  id: uuidSchema,
})

// Create points schema for POST /points-schemas
export const pointsSchemasCreateSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
  })
  .strict()

// Update points schema for PATCH /points-schemas/:id
export const pointsSchemasUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type PointsSchemasQuery = z.infer<typeof pointsSchemasQuerySchema>
export type PointsSchemasParams = z.infer<typeof pointsSchemasParamsSchema>
export type PointsSchemasCreate = z.infer<typeof pointsSchemasCreateSchema>
export type PointsSchemasUpdate = z.infer<typeof pointsSchemasUpdateSchema>
