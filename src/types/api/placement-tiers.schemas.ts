import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /placement-tiers
export const placementTiersQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z.enum(['name', 'rank', 'createdAt', 'updatedAt']).optional(),
  })
  .strict()

// Route parameters for GET /placement-tiers/:id
export const placementTiersParamsSchema = z.object({
  id: uuidSchema,
})

// Create placement tier schema for POST /placement-tiers
export const placementTiersCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be 50 characters or less')
      .regex(/^[A-Z0-9_]+$/, 'Name must be uppercase letters, numbers, and underscores only (e.g., WINNER, QF, R16, POS_1)'),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name must be 100 characters or less')
      .optional()
      .nullable(),
    description: descriptionSchema,
    rank: z
      .number()
      .int('Rank must be an integer')
      .positive('Rank must be positive')
      .min(1, 'Rank must be at least 1'),
  })
  .strict()

// Update placement tier schema for PATCH /placement-tiers/:id
export const placementTiersUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be 50 characters or less')
      .regex(/^[A-Z0-9_]+$/, 'Name must be uppercase letters, numbers, and underscores only')
      .optional(),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name must be 100 characters or less')
      .optional()
      .nullable(),
    description: descriptionSchema,
    rank: z
      .number()
      .int('Rank must be an integer')
      .positive('Rank must be positive')
      .min(1, 'Rank must be at least 1')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type PlacementTiersQuery = z.infer<typeof placementTiersQuerySchema>
export type PlacementTiersParams = z.infer<typeof placementTiersParamsSchema>
export type PlacementTiersCreate = z.infer<typeof placementTiersCreateSchema>
export type PlacementTiersUpdate = z.infer<typeof placementTiersUpdateSchema>
