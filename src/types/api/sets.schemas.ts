import { z } from 'zod'

// Query parameters for GET /sets
export const setsQuerySchema = z
  .object({
    matchId: z.uuid('Invalid match ID format').optional(),
  })
  .strict()

// Route parameters for GET /sets/:id
export const setsParamsSchema = z.object({
  id: z.uuid('Invalid set ID format'),
})

// Create set schema for POST /sets
export const setsCreateSchema = z
  .object({
    matchId: z.uuid('Invalid match ID format'),
    setNumber: z.number().int().positive('Set number must be positive'),
    registration1Score: z.number().int().min(0, 'Score must be non-negative'),
    registration2Score: z.number().int().min(0, 'Score must be non-negative'),
  })
  .strict()

// Update set schema for PATCH /sets/:id
export const setsUpdateSchema = z
  .object({
    registration1Score: z
      .number()
      .int()
      .min(0, 'Score must be non-negative')
      .optional(),
    registration2Score: z
      .number()
      .int()
      .min(0, 'Score must be non-negative')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type SetsQuery = z.infer<typeof setsQuerySchema>
export type SetsParams = z.infer<typeof setsParamsSchema>
export type SetsCreate = z.infer<typeof setsCreateSchema>
export type SetsUpdate = z.infer<typeof setsUpdateSchema>
