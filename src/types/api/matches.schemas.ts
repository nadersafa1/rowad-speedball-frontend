import { z } from 'zod'

// Query parameters for GET /matches
export const matchesQuerySchema = z
  .object({
    eventId: z.uuid('Invalid event ID format').optional(),
    groupId: z.uuid('Invalid group ID format').optional(),
    round: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => !val || val >= 1, 'Round must be greater than 0'),
  })
  .strict()

// Route parameters for GET /matches/:id
export const matchesParamsSchema = z.object({
  id: z.uuid('Invalid match ID format'),
})

// Update match schema for PATCH /matches/:id
export const matchesUpdateSchema = z
  .object({
    played: z.boolean().optional(),
    winnerId: z.uuid('Invalid winner ID format').nullable().optional(),
    matchDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type MatchesQuery = z.infer<typeof matchesQuerySchema>
export type MatchesParams = z.infer<typeof matchesParamsSchema>
export type MatchesUpdate = z.infer<typeof matchesUpdateSchema>
