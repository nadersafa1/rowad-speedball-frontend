import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'

// Query parameters for GET /championships
export const championshipsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(100, 'q must be less than 100 characters')
      .optional(),
    federationId: uuidSchema.optional(),
    // Sorting parameters
    sortBy: z
      .enum(['name', 'startDate', 'endDate', 'createdAt', 'updatedAt'])
      .optional(),
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
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine(
        (val) => val >= 1 && val <= 100,
        'Limit must be between 1 and 100'
      ),
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
      .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
    endDate: z
      .string()
      .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
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
      .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
      .optional()
      .nullable(),
    endDate: z
      .string()
      .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
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

