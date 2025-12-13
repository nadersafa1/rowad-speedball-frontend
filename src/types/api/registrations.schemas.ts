import { z } from 'zod'

// Position enum for team test events
export const PLAYER_POSITIONS = ['R', 'L', 'F', 'B', 'S1', 'S2'] as const
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number]

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

// Player with position and order for team events
export const playerWithPositionSchema = z.object({
  playerId: z.uuid('Invalid player ID format'),
  position: z.enum(PLAYER_POSITIONS).nullable().optional(),
  order: z.number().int().min(1).optional(),
})

// Create registration schema for POST /registrations
export const registrationsCreateSchema = z.object({
  eventId: z.uuid('Invalid event ID format'),
  playerIds: z
    .array(z.uuid('Invalid player ID format'))
    .min(1, 'At least one player is required'),
  // Optional: players with positions and order for team events
  players: z.array(playerWithPositionSchema).optional(),
})

// Update registration schema for PATCH /registrations/:id
export const registrationsUpdateSchema = z
  .object({
    groupId: z.uuid('Invalid group ID format').nullable().optional(),
    qualified: z.boolean().optional(),
    playerIds: z
      .array(z.uuid('Invalid player ID format'))
      .min(1, 'At least one player is required')
      .optional(),
    // Optional: players with positions and order for team events
    players: z.array(playerWithPositionSchema).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Update registration scores schema for test events
export const registrationScoresUpdateSchema = z
  .object({
    leftHandScore: z.number().int().min(0).optional(),
    rightHandScore: z.number().int().min(0).optional(),
    forehandScore: z.number().int().min(0).optional(),
    backhandScore: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one score field must be provided'
  )

// Inferred TypeScript types
export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>
export type RegistrationsParams = z.infer<typeof registrationsParamsSchema>
export type RegistrationsCreate = z.infer<typeof registrationsCreateSchema>
export type RegistrationsUpdate = z.infer<typeof registrationsUpdateSchema>
export type RegistrationScoresUpdate = z.infer<
  typeof registrationScoresUpdateSchema
>
export type PlayerWithPosition = z.infer<typeof playerWithPositionSchema>
