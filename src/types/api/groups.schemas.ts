import { z } from 'zod'

// Query parameters for GET /groups
export const groupsQuerySchema = z
  .object({
    eventId: z.uuid('Invalid event ID format').optional(),
  })
  .strict()

// Route parameters for GET /groups/:id
export const groupsParamsSchema = z.object({
  id: z.uuid('Invalid group ID format'),
})

// Create group schema for POST /groups
export const groupsCreateSchema = z
  .object({
    eventId: z.uuid('Invalid event ID format'),
    registrationIds: z
      .array(z.uuid('Invalid registration ID format'))
      .min(2, 'At least 2 registrations are required for a group'),
  })
  .strict()

// Inferred TypeScript types
export type GroupsQuery = z.infer<typeof groupsQuerySchema>
export type GroupsParams = z.infer<typeof groupsParamsSchema>
export type GroupsCreate = z.infer<typeof groupsCreateSchema>
