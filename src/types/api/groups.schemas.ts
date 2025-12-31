import { z } from 'zod'
import { uuidSchema } from '@/lib/forms/patterns'

// Query parameters for GET /groups
export const groupsQuerySchema = z
  .object({
    eventId: uuidSchema.optional(),
  })
  .strict()

// Route parameters for GET /groups/:id
export const groupsParamsSchema = z.object({
  id: uuidSchema,
})

// Create group schema for POST /groups
export const groupsCreateSchema = z
  .object({
    eventId: uuidSchema,
    registrationIds: z
      .array(uuidSchema)
      .min(2, 'At least 2 registrations are required for a group'),
  })
  .strict()

// Inferred TypeScript types
export type GroupsQuery = z.infer<typeof groupsQuerySchema>
export type GroupsParams = z.infer<typeof groupsParamsSchema>
export type GroupsCreate = z.infer<typeof groupsCreateSchema>
