import { z } from 'zod'
import { uuidSchema, positiveIntSchema, nonNegativeIntSchema } from '@/lib/forms/patterns'

// Query parameters for GET /sets
export const setsQuerySchema = z
  .object({
    matchId: uuidSchema.optional(),
  })
  .strict()

// Route parameters for GET /sets/:id
export const setsParamsSchema = z.object({
  id: uuidSchema,
})

// Create set schema for POST /sets
export const setsCreateSchema = z
  .object({
    matchId: uuidSchema,
    setNumber: positiveIntSchema('Set number'),
    registration1Score: nonNegativeIntSchema('Score'),
    registration2Score: nonNegativeIntSchema('Score'),
  })
  .strict()

// Update set schema for PATCH /sets/:id
export const setsUpdateSchema = z
  .object({
    registration1Score: nonNegativeIntSchema('Score').optional(),
    registration2Score: nonNegativeIntSchema('Score').optional(),
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
