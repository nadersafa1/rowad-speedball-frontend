import { z } from 'zod'
import { nameSchema, uuidSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /organizations
export const organizationsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    sortBy: z.enum(['name', 'slug', 'createdAt']).optional(),
  })
  .strict()

export const organizationsCreateSchema = z
  .object({
    name: nameSchema,
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(255, 'Slug is too long')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    members: z
      .array(
        z.object({
          userId: uuidSchema,
          role: z.enum(['owner', 'admin', 'coach', 'member', 'player']),
        })
      )
      .optional()
      .default([]),
  })
  .strict()

export type OrganizationsQuery = z.infer<typeof organizationsQuerySchema>
export type OrganizationsCreate = z.infer<typeof organizationsCreateSchema>


