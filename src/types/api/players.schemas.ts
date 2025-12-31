import { z } from 'zod'
import { TEAM_LEVELS, TEAM_LEVEL_FILTER_OPTIONS } from '@/types/team-level'
import {
  nameSchema,
  rtlNameSchema,
  genderSchema,
  preferredHandSchema,
  uuidSchema,
  optionalUuidSchema,
  dateStringSchema,
} from '@/lib/forms/patterns'
import {
  standardPaginationSchema,
  standardSortSchema,
  standardTextSearchSchema,
} from '@/lib/api-helpers/query-builders'

// Team level enum for validation
const teamLevelEnum = z.enum(TEAM_LEVELS)
const teamLevelFilterEnum = z.enum(TEAM_LEVEL_FILTER_OPTIONS)

// Query parameters for GET /players
export const playersQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    gender: z.enum(['male', 'female', 'all']).optional(),
    ageGroup: z
      .enum([
        'mini',
        'U-09',
        'U-11',
        'U-13',
        'U-15',
        'U-17',
        'U-19',
        'U-21',
        'Seniors',
        'all',
      ])
      .optional(),
    preferredHand: z.enum(['left', 'right', 'both']).optional(),
    team: teamLevelFilterEnum.optional(),
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
    sortBy: z
      .enum([
        'name',
        'nameRtl',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
        'gender',
        'preferredHand',
        'teamLevel',
        'organizationId',
      ])
      .optional(),
    unassigned: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .strict()

// Route parameters for GET /players/:id
export const playersParamsSchema = z.object({
  id: z.uuid('Invalid player ID format'),
})

// Create player schema for POST /players
export const playersCreateSchema = z
  .object({
    name: nameSchema,
    nameRtl: rtlNameSchema,
    dateOfBirth: dateStringSchema,
    gender: genderSchema,
    preferredHand: preferredHandSchema,
    teamLevel: teamLevelEnum.optional(),
    userId: optionalUuidSchema,
    organizationId: optionalUuidSchema,
  })
  .strict()

// Update player schema for PATCH /players/:id
export const playersUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
    nameRtl: z.string().max(255, 'RTL Name is too long').optional().nullable(),
    dateOfBirth: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .refine(
        (date) => new Date(date) <= new Date(),
        'Date of birth cannot be in the future'
      )
      .optional(),
    gender: z
      .enum(['male', 'female'], { message: 'Gender must be male or female' })
      .optional(),
    preferredHand: z
      .enum(['left', 'right', 'both'], {
        message: 'Preferred hand must be left, right, or both',
      })
      .optional(),
    teamLevel: teamLevelEnum.optional(),
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

// Query parameters for GET /players/:id/matches
export const playerMatchesQuerySchema = z
  .object({
    ...standardPaginationSchema.shape,
  })
  .strict()

// Inferred TypeScript types
export type PlayersQuery = z.infer<typeof playersQuerySchema>
export type PlayersParams = z.infer<typeof playersParamsSchema>
export type PlayersCreate = z.infer<typeof playersCreateSchema>
export type PlayersUpdate = z.infer<typeof playersUpdateSchema>
export type PlayerMatchesQuery = z.infer<typeof playerMatchesQuerySchema>
