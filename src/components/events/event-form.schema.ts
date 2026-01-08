import { z } from 'zod'
import { UI_EVENT_TYPES } from '@/types/event-types'

// Validation schema - matches backend schema exactly
export const eventSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    eventType: z.enum(UI_EVENT_TYPES, {
      message: 'Event type is required',
    }),
    gender: z.enum(['male', 'female', 'mixed'], {
      message: 'Gender is required',
    }),
    format: z.enum(
      [
        'groups',
        'single-elimination',
        'groups-knockout',
        'double-elimination',
        'tests',
      ],
      {
        message: 'Format is required',
      }
    ),
    visibility: z.enum(['public', 'private']),
    minPlayers: z.number().int().min(1, 'Must be at least 1'),
    maxPlayers: z.number().int().min(1, 'Must be at least 1'),
    registrationStartDate: z.date('Invalid date format'),
    registrationEndDate: z.date('Invalid date format'),
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
    // For single-elimination: whether to include a third place match
    hasThirdPlaceMatch: z.boolean().optional(),
    // For double-elimination: how many rounds before finals the losers bracket starts
    losersStartRoundsBeforeFinal: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    // For test events: number of players per heat
    playersPerHeat: z.number().int().min(1).optional(),
    organizationId: z.uuid().nullable().optional(),
    // Championship-related fields
    championshipEditionId: z.uuid().optional(),
    pointsSchemaId: z.uuid('Points schema is required'),
  })
  .refine(
    (data) => {
      // End date must be after start date
      return data.registrationEndDate >= data.registrationStartDate
    },
    {
      message: 'End date must be after start date',
      path: ['registrationEndDate'],
    }
  )
  .refine((data) => data.minPlayers <= data.maxPlayers, {
    message: 'Min players must be less than or equal to max players',
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

export type EventFormData = z.infer<typeof eventSchema>
