import { z } from 'zod'

// Query parameters for GET /events
export const eventsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(50, 'q must be less than 50 characters')
      .optional(),
    eventType: z.enum(['singles', 'doubles']).optional(),
    gender: z.enum(['male', 'female', 'mixed']).optional(),
    visibility: z.enum(['public', 'private']).optional(),
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
    eventType: z.enum(['singles', 'doubles'], {
      message: 'Event type must be singles or doubles',
    }),
    gender: z.enum(['male', 'female', 'mixed'], {
      message: 'Gender must be male, female, or mixed',
    }),
    groupMode: z.enum(['single', 'multiple'], {
      message: 'Group mode must be single or multiple',
    }),
    visibility: z.enum(['public', 'private']).optional().default('public'),
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
    pointsPerWin: z.number().int().min(0).optional().default(3),
    pointsPerLoss: z.number().int().min(0).optional().default(0),
  })
  .strict()

// Update event schema for PATCH /events/:id
export const eventsUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
    eventType: z
      .enum(['singles', 'doubles'], {
        message: 'Event type must be singles or doubles',
      })
      .optional(),
    gender: z
      .enum(['male', 'female', 'mixed'], {
        message: 'Gender must be male, female, or mixed',
      })
      .optional(),
    groupMode: z
      .enum(['single', 'multiple'], {
        message: 'Group mode must be single or multiple',
      })
      .optional(),
    visibility: z.enum(['public', 'private']).optional(),
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
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type EventsQuery = z.infer<typeof eventsQuerySchema>
export type EventsParams = z.infer<typeof eventsParamsSchema>
export type EventsCreate = z.infer<typeof eventsCreateSchema>
export type EventsUpdate = z.infer<typeof eventsUpdateSchema>
