import { z } from 'zod'

export const organizationsCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(255, 'Slug is too long')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    members: z
      .array(
        z.object({
          userId: z.uuid('Invalid user ID format'),
          role: z.enum(['owner', 'admin', 'coach', 'member', 'player']),
        })
      )
      .optional()
      .default([]),
  })
  .strict()

export type OrganizationsCreate = z.infer<typeof organizationsCreateSchema>


