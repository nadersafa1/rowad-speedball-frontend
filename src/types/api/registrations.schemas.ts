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
// Supports both old format (player1Id, player2Id) and new format (playerIds array)
export const registrationsCreateSchema = z
  .object({
    eventId: z.uuid('Invalid event ID format'),
    // New format: array of player IDs (preferred)
    playerIds: z
      .array(z.uuid('Invalid player ID format'))
      .min(1, 'At least one player is required')
      .max(4, 'Maximum 4 players per registration')
      .optional(),
    // @deprecated - Legacy format for backward compatibility
    player1Id: z.uuid('Invalid player ID format').optional(),
    // @deprecated - Legacy format for backward compatibility
    player2Id: z.uuid('Invalid player ID format').nullable().optional(),
  })
  .refine(
    (data) => data.playerIds || data.player1Id,
    'Either playerIds array or player1Id must be provided'
  )

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
