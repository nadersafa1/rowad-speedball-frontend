import { z } from 'zod'
import { nameSchema, uuidSchema } from '@/lib/forms/patterns'

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

export type OrganizationsCreate = z.infer<typeof organizationsCreateSchema>


