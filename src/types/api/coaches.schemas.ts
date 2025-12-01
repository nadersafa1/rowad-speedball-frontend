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
    sortBy: z.enum(['name', 'nameRtl', 'gender', 'createdAt', 'updatedAt', 'organizationId']).optional(),
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
    unassigned: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    organizationId: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'null') return null
        return val
      })
      .refine(
        (val) =>
          val === undefined || val === null || z.uuid().safeParse(val).success,
        'Invalid organization ID format'
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
    nameRtl: z.string().max(255, 'RTL Name is too long').optional().nullable(),
    gender: z.enum(['male', 'female'], {
      message: 'Gender must be male or female',
    }),
    userId: z.uuid('Invalid user ID format').optional().nullable(),
    organizationId: z
      .uuid('Invalid organization ID format')
      .optional()
      .nullable(),
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
    nameRtl: z.string().max(255, 'RTL Name is too long').optional().nullable(),
    gender: z
      .enum(['male', 'female'], { message: 'Gender must be male or female' })
      .optional(),
    userId: z.uuid('Invalid user ID format').optional().nullable(),
    organizationId: z
      .uuid('Invalid organization ID format')
      .optional()
      .nullable(),
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
