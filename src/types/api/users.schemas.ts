import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'
import { z } from 'zod'

export const usersQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    role: z.enum(['admin', 'user']).optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional(),
    unassigned: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .strict()

export type UsersQuery = z.infer<typeof usersQuerySchema>
