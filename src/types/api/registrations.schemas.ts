import { z } from 'zod'
import type { PositionScores, PositionKey } from '@/types/position-scores'
import { POSITION_KEYS } from '@/types/position-scores'

// Position scores schema for JSONB column
// Keys: R, L, F, B - represent positions
// Values: number (score) or null (position assigned but score pending)
export const positionScoresSchema = z
  .object({
    R: z.number().int().min(0).nullable().optional(),
    L: z.number().int().min(0).nullable().optional(),
    F: z.number().int().min(0).nullable().optional(),
    B: z.number().int().min(0).nullable().optional(),
  })
  .nullable()
  .optional()
  .refine((data) => {
    if (data === null || data === undefined) return true
    // If provided, must have at least one position key
    const keys = Object.keys(data) as PositionKey[]
    return keys.length === 0 || keys.some((k) => POSITION_KEYS.includes(k))
  }, 'If provided, positionScores must have at least one valid position key')

// Query parameters for GET /registrations
export const registrationsQuerySchema = z
  .object({
    eventId: z.uuid('Invalid event ID format').optional(),
    groupId: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'null' || val === 'all') return undefined
        return val
      })
      .refine(
        (val) =>
          val === undefined || z.uuid().safeParse(val).success,
        'Invalid group ID format'
      ),
    organizationId: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'null' || val === 'all') return undefined
        return val
      })
      .refine(
        (val) =>
          val === undefined || z.uuid().safeParse(val).success,
        'Invalid organization ID format'
      ),
    q: z
      .string()
      .trim()
      .max(100, 'q must be less than 100 characters')
      .optional(),
    sortBy: z
      .enum([
        'totalScore',
        'createdAt',
        'rank',
        'playerName',
        'heat',
        'club',
        'positionR',
        'positionL',
        'positionF',
        'positionB',
      ])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine(
        (val) => val >= 1 && val <= 100,
        'Limit must be between 1 and 100'
      ),
  })
  .strict()

// Route parameters for GET /registrations/:id
export const registrationsParamsSchema = z.object({
  id: z.uuid('Invalid registration ID format'),
})

// Player with position scores and order for team events
export const playerWithPositionSchema = z.object({
  playerId: z.uuid('Invalid player ID format'),
  positionScores: positionScoresSchema,
  order: z.number().int().min(1).optional(),
})

// Create registration schema for POST /registrations
export const registrationsCreateSchema = z.object({
  eventId: z.uuid('Invalid event ID format'),
  playerIds: z
    .array(z.uuid('Invalid player ID format'))
    .min(1, 'At least one player is required'),
  // Optional: players with position scores and order for team events
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
    // Optional: players with position scores and order for team events
    players: z.array(playerWithPositionSchema).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Update player position scores schema for test events
// Used to update a single player's positionScores
export const playerPositionScoresUpdateSchema = z.object({
  positionScores: z
    .object({
      R: z.number().int().min(0).nullable().optional(),
      L: z.number().int().min(0).nullable().optional(),
      F: z.number().int().min(0).nullable().optional(),
      B: z.number().int().min(0).nullable().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one position score must be provided'
    ),
})

// Inferred TypeScript types
export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>
export type RegistrationsParams = z.infer<typeof registrationsParamsSchema>
export type RegistrationsCreate = z.infer<typeof registrationsCreateSchema>
export type RegistrationsUpdate = z.infer<typeof registrationsUpdateSchema>
export type PlayerPositionScoresUpdate = z.infer<
  typeof playerPositionScoresUpdateSchema
>
export type PlayerWithPosition = z.infer<typeof playerWithPositionSchema>
export type { PositionScores, PositionKey }
