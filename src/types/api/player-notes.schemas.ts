import { z } from 'zod'
import { uuidSchema } from '@/lib/forms/patterns'

// Note type enum for validation
const noteTypeEnum = z.enum(['performance', 'medical', 'behavioral', 'general'])

// Query parameters for GET /players/:playerId/notes
export const playerNotesQuerySchema = z
  .object({
    noteType: z
      .enum(['performance', 'medical', 'behavioral', 'general', 'all'])
      .optional(),
    // Sorting parameters
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    // Pagination parameters
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine(
        (val) => val >= 1 && val <= 100,
        'Limit must be between 1 and 100'
      ),
  })
  .strict()

// Route parameters for player notes endpoints
export const playerNoteParamsSchema = z.object({
  playerId: uuidSchema,
  noteId: uuidSchema.optional(),
})

// Create player note schema for POST /players/:playerId/notes
export const playerNotesCreateSchema = z
  .object({
    content: z
      .string()
      .min(1, 'Note content is required')
      .max(5000, 'Note content is too long (max 5000 characters)'),
    noteType: noteTypeEnum.default('general'),
  })
  .strict()

// Update player note schema for PATCH /players/:playerId/notes/:noteId
export const playerNotesUpdateSchema = z
  .object({
    content: z
      .string()
      .min(1, 'Note content is required')
      .max(5000, 'Note content is too long (max 5000 characters)')
      .optional(),
    noteType: noteTypeEnum.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type PlayerNotesQuery = z.infer<typeof playerNotesQuerySchema>
export type PlayerNoteParams = z.infer<typeof playerNoteParamsSchema>
export type PlayerNotesCreate = z.infer<typeof playerNotesCreateSchema>
export type PlayerNotesUpdate = z.infer<typeof playerNotesUpdateSchema>
