import { z } from 'zod'

export const usersQuerySchema = z
  .object({
    q: z.string().trim().max(50).optional(),
    role: z.enum(['admin', 'user']).optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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
  })
  .strict()

export type UsersQuery = z.infer<typeof usersQuerySchema>


