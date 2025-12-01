import { z } from 'zod'

// Query parameters for GET /registrations
export const registrationsQuerySchema = z
  .object({
    eventId: z.uuid('Invalid event ID format').optional(),
    groupId: z.uuid('Invalid group ID format').optional(),
  })
  .strict()

// Route parameters for GET /registrations/:id
export const registrationsParamsSchema = z.object({
  id: z.uuid('Invalid registration ID format'),
})

// Create registration schema for POST /registrations
export const registrationsCreateSchema = z.object({
  eventId: z.uuid('Invalid event ID format'),
  playerIds: z
    .array(z.uuid('Invalid player ID format'))
    .min(1, 'At least one player is required'),
})

// Update registration schema for PATCH /registrations/:id
export const registrationsUpdateSchema = z
  .object({
    groupId: z.uuid('Invalid group ID format').nullable().optional(),
    qualified: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>
export type RegistrationsParams = z.infer<typeof registrationsParamsSchema>
export type RegistrationsCreate = z.infer<typeof registrationsCreateSchema>
export type RegistrationsUpdate = z.infer<typeof registrationsUpdateSchema>
