import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'
// Query parameters for GET /federations
export const federationsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  })
  .strict()

// Route parameters for GET /federations/:id
export const federationsParamsSchema = z.object({
  id: uuidSchema,
})

// Create federation schema for POST /federations
export const federationsCreateSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
  })
  .strict()

// Update federation schema for PATCH /federations/:id
export const federationsUpdateSchema = z
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
export type FederationsQuery = z.infer<typeof federationsQuerySchema>
export type FederationsParams = z.infer<typeof federationsParamsSchema>
export type FederationsCreate = z.infer<typeof federationsCreateSchema>
export type FederationsUpdate = z.infer<typeof federationsUpdateSchema>
