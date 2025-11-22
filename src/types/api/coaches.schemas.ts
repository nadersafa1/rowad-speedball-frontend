import { z } from 'zod'

// Query parameters for GET /coaches
export const coachesQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(20, 'q must be less than 20 characters')
      .optional(),
    gender: z.enum(['male', 'female', 'all']).optional(),
    // Sorting parameters
    sortBy: z
      .enum(['name', 'gender', 'createdAt', 'updatedAt'])
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

// Route parameters for GET /coaches/:id
export const coachesParamsSchema = z.object({
  id: z.uuid('Invalid coach ID format'),
})

// Create coach schema for POST /coaches
export const coachesCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    gender: z.enum(['male', 'female'], {
      message: 'Gender must be male or female',
    }),
  })
  .strict()

// Update coach schema for PATCH /coaches/:id
export const coachesUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
    gender: z
      .enum(['male', 'female'], { message: 'Gender must be male or female' })
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Inferred TypeScript types
export type CoachesQuery = z.infer<typeof coachesQuerySchema>
export type CoachesParams = z.infer<typeof coachesParamsSchema>
export type CoachesCreate = z.infer<typeof coachesCreateSchema>
export type CoachesUpdate = z.infer<typeof coachesUpdateSchema>

