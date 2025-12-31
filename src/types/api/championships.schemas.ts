import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'

// Query parameters for GET /championships
export const championshipsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    federationId: uuidSchema.optional(),
    sortBy: z
      .enum(['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'])
      .optional(),
  })
  .strict()

// Route parameters for GET /championships/:id
export const championshipsParamsSchema = z.object({
  id: uuidSchema,
})

// Create championship schema for POST /championships
export const championshipsCreateSchema = z
  .object({
    name: nameSchema,
    federationId: uuidSchema,
    description: descriptionSchema,
    startDate: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format'
      )
      .optional()
      .nullable(),
    endDate: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format'
      )
      .optional()
      .nullable(),
  })
  .strict()

// Update championship schema for PATCH /championships/:id
export const championshipsUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    startDate: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format'
      )
      .optional()
      .nullable(),
    endDate: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        'Invalid date format'
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type ChampionshipsQuery = z.infer<typeof championshipsQuerySchema>
export type ChampionshipsParams = z.infer<typeof championshipsParamsSchema>
export type ChampionshipsCreate = z.infer<typeof championshipsCreateSchema>
export type ChampionshipsUpdate = z.infer<typeof championshipsUpdateSchema>
