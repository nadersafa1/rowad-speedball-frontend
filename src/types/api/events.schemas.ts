import { z } from 'zod'
import { EVENT_TYPES } from '../event-types'

// Event format types
export const EVENT_FORMATS = [
  'groups',
  'single-elimination',
  'groups-knockout',
  'double-elimination',
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
    organizationId: z
      .uuid('Invalid organization ID format')
      .nullable()
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

// Update event schema for PATCH /events/:id
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
    organizationId: z
      .uuid('Invalid organization ID format')
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

// Inferred TypeScript types
export type EventsQuery = z.infer<typeof eventsQuerySchema>
export type EventsParams = z.infer<typeof eventsParamsSchema>
export type EventsCreate = z.infer<typeof eventsCreateSchema>
export type EventsUpdate = z.infer<typeof eventsUpdateSchema>
