import { z } from 'zod'
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'

// Query parameters for GET /federations
export const federationsQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(100, 'q must be less than 100 characters')
      .optional(),
    // Sorting parameters
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
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

// Route parameters for GET /federations/:id
export const federationsParamsSchema = z.object({
  id: uuidSchema,
})

// Create federation schema for POST /federations
export const federationsCreateSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
  })
  .strict()

// Update federation schema for PATCH /federations/:id
export const federationsUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type FederationsQuery = z.infer<typeof federationsQuerySchema>
export type FederationsParams = z.infer<typeof federationsParamsSchema>
export type FederationsCreate = z.infer<typeof federationsCreateSchema>
export type FederationsUpdate = z.infer<typeof federationsUpdateSchema>
