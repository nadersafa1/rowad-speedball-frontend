import { z } from 'zod'
import {
  EVENT_TYPES,
  isTestEventType,
  isSoloTestEventType,
  isFixedPlayerCount,
  getEventTypePlayerLimits,
} from '../event-types'

// Event format types
export const EVENT_FORMATS = [
  'groups',
  'single-elimination',
  'groups-knockout',
  'double-elimination',
  'tests',
] as const
export type EventFormat = (typeof EVENT_FORMATS)[number]

// Query parameters for GET /events
export const eventsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(50, 'q must be less than 50 characters')
      .optional(),
    eventType: z.enum(EVENT_TYPES).optional(),
    gender: z.enum(['male', 'female', 'mixed']).optional(),
    format: z.enum(EVENT_FORMATS).optional(),
    visibility: z.enum(['public', 'private']).optional(),
    organizationId: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'null') return null
        return val
      })
      .refine(
        (val) =>
          val === undefined || val === null || z.uuid().safeParse(val).success,
        'Invalid organization ID format'
      ),
    trainingSessionId: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || z.uuid().safeParse(val).success,
        'Invalid training session ID format'
      ),
    sortBy: z
      .enum([
        'name',
        'eventType',
        'gender',
        'completed',
        'createdAt',
        'updatedAt',
        'registrationStartDate',
        'registrationsCount',
        'lastMatchPlayedDate',
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

// Route parameters for GET /events/:id
export const eventsParamsSchema = z.object({
  id: z.uuid('Invalid event ID format'),
})

// Create event schema for POST /events
export const eventsCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    eventType: z.enum(EVENT_TYPES, {
      message:
        'Event type must be solo, singles, doubles, singles-teams, solo-teams, or relay',
    }),
    gender: z.enum(['male', 'female', 'mixed'], {
      message: 'Gender must be male, female, or mixed',
    }),
    format: z
      .enum(EVENT_FORMATS, {
        message:
          'Format must be groups, single-elimination, groups-knockout, or double-elimination',
      })
      .optional()
      .default('groups'),
    hasThirdPlaceMatch: z.boolean().optional().default(false),
    visibility: z.enum(['public', 'private']).optional().default('public'),
    minPlayers: z
      .number()
      .int('minPlayers must be an integer')
      .min(1, 'minPlayers must be at least 1')
      .optional()
      .default(1),
    maxPlayers: z
      .number()
      .int('maxPlayers must be an integer')
      .min(1, 'maxPlayers must be at least 1')
      .optional()
      .default(2),
    registrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    registrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    eventDates: z.array(z.string()).optional(),
    bestOf: z
      .number()
      .int('bestOf must be an integer')
      .positive('bestOf must be positive')
      .refine(
        (val) => val % 2 === 1,
        'bestOf must be an odd number (1, 3, 5, 7, etc.)'
      ),
    pointsPerWin: z.number().int().min(0).optional(),
    pointsPerLoss: z.number().int().min(0).optional(),
    // For double-elimination: how many rounds before finals the losers bracket starts
    // null = full double elimination, 2 = starts at QF (for 16 players), 1 = starts at SF
    losersStartRoundsBeforeFinal: z
      .number()
      .int('losersStartRoundsBeforeFinal must be an integer')
      .positive('losersStartRoundsBeforeFinal must be positive')
      .nullable()
      .optional(),
    organizationId: z
      .uuid('Invalid organization ID format')
      .nullable()
      .optional(),
    trainingSessionId: z.uuid('Invalid training session ID format').optional(),
    // For test events: number of players per heat (default 8)
    playersPerHeat: z
      .number()
      .int('playersPerHeat must be an integer')
      .min(1, 'playersPerHeat must be at least 1')
      .optional(),
  })
  .strict()
  .refine((data) => data.minPlayers <= data.maxPlayers, {
    message: 'minPlayers must be less than or equal to maxPlayers',
    path: ['minPlayers'],
  })
  .refine(
    (data) => {
      // Points per win/loss are required only for groups format
      if (data.format === 'groups' || data.format === 'groups-knockout') {
        return (
          data.pointsPerWin !== undefined && data.pointsPerLoss !== undefined
        )
      }
      return true
    },
    {
      message: 'Points per win and loss are required for groups format',
      path: ['pointsPerWin'],
    }
  )
  .refine(
    (data) => {
      // losersStartRoundsBeforeFinal is only valid for double-elimination format
      if (
        data.losersStartRoundsBeforeFinal !== undefined &&
        data.losersStartRoundsBeforeFinal !== null &&
        data.format !== 'double-elimination'
      ) {
        return false
      }
      return true
    },
    {
      message:
        'losersStartRoundsBeforeFinal is only valid for double-elimination format',
      path: ['losersStartRoundsBeforeFinal'],
    }
  )
  .refine(
    (data) => {
      // playersPerHeat is only valid for test events
      if (
        data.playersPerHeat !== undefined &&
        !isTestEventType(data.eventType)
      ) {
        return false
      }
      return true
    },
    {
      message: 'playersPerHeat is only valid for test events',
      path: ['playersPerHeat'],
    }
  )
  .transform((data) => {
    let result = { ...data }

    // Auto-set format to 'tests' for test events if not explicitly set
    if (isTestEventType(data.eventType) && data.format === 'groups') {
      result = { ...result, format: 'tests' as const }
    }

    // For fixed player count events, override min/max with correct values
    if (isFixedPlayerCount(data.eventType)) {
      const limits = getEventTypePlayerLimits(data.eventType)
      result = { ...result, minPlayers: limits.min, maxPlayers: limits.max }
    }

    return result
  })

// Update event schema for PATCH /events/:id
// Note: For fixed player count events (super-solo, speed-solo, juniors-solo),
// min/max players cannot be changed. This is validated at runtime in the API route
// since we need the existing event's eventType to validate.
export const eventsUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
    eventType: z
      .enum(EVENT_TYPES, {
        message:
          'Event type must be solo, singles, doubles, singles-teams, solo-teams, or relay',
      })
      .optional(),
    gender: z
      .enum(['male', 'female', 'mixed'], {
        message: 'Gender must be male, female, or mixed',
      })
      .optional(),
    format: z
      .enum(EVENT_FORMATS, {
        message:
          'Format must be groups, single-elimination, groups-knockout, or double-elimination',
      })
      .optional(),
    hasThirdPlaceMatch: z.boolean().optional(),
    visibility: z.enum(['public', 'private']).optional(),
    minPlayers: z
      .number()
      .int('minPlayers must be an integer')
      .min(1, 'minPlayers must be at least 1')
      .optional(),
    maxPlayers: z
      .number()
      .int('maxPlayers must be an integer')
      .min(1, 'maxPlayers must be at least 1')
      .optional(),
    registrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    registrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    eventDates: z.array(z.string()).optional(),
    bestOf: z
      .number()
      .int('bestOf must be an integer')
      .positive('bestOf must be positive')
      .refine(
        (val) => val % 2 === 1,
        'bestOf must be an odd number (1, 3, 5, 7, etc.)'
      )
      .optional(),
    pointsPerWin: z.number().int().min(0).optional(),
    pointsPerLoss: z.number().int().min(0).optional(),
    losersStartRoundsBeforeFinal: z
      .number()
      .int('losersStartRoundsBeforeFinal must be an integer')
      .positive('losersStartRoundsBeforeFinal must be positive')
      .nullable()
      .optional(),
    organizationId: z
      .uuid('Invalid organization ID format')
      .nullable()
      .optional(),
    // For test events: number of players per heat (default 8)
    playersPerHeat: z
      .number()
      .int('playersPerHeat must be an integer')
      .min(1, 'playersPerHeat must be at least 1')
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .refine(
    (data) => {
      if (data.minPlayers !== undefined && data.maxPlayers !== undefined) {
        return data.minPlayers <= data.maxPlayers
      }
      return true
    },
    {
      message: 'minPlayers must be less than or equal to maxPlayers',
      path: ['minPlayers'],
    }
  )

/**
 * Validates that min/max players cannot be changed for fixed player count events.
 * This is used at runtime in the API route since we need the existing event's eventType.
 */
export const validatePlayerLimitsUpdate = (
  existingEventType: string,
  updateData: { minPlayers?: number; maxPlayers?: number }
): { valid: boolean; error?: string } => {
  if (isFixedPlayerCount(existingEventType)) {
    if (updateData.minPlayers !== undefined || updateData.maxPlayers !== undefined) {
      return {
        valid: false,
        error: `Cannot change min/max players for ${existingEventType} events. Player limits are fixed.`,
      }
    }
  }
  return { valid: true }
}

// Inferred TypeScript types
export type EventsQuery = z.infer<typeof eventsQuerySchema>
export type EventsParams = z.infer<typeof eventsParamsSchema>
export type EventsCreate = z.infer<typeof eventsCreateSchema>
export type EventsUpdate = z.infer<typeof eventsUpdateSchema>
