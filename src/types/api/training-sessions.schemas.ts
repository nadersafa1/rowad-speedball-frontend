import { z } from 'zod'
import { TEAM_LEVELS } from '@/types/team-level'
import {
  nameSchema,
  uuidSchema,
  optionalUuidSchema,
} from '@/lib/forms/patterns'
import {
  standardTextSearchSchema,
  standardPaginationSchema,
  standardSortSchema,
} from '@/lib/api-helpers/query-builders'
// Team level enum for validation
const teamLevelEnum = z.enum(TEAM_LEVELS)

// Session type enum values
const sessionTypeEnum = z.enum([
  'singles',
  'men_doubles',
  'women_doubles',
  'mixed_doubles',
  'solo',
  'relay',
])

// Age group enum values
const ageGroupEnum = z.enum([
  'mini',
  'U-09',
  'U-11',
  'U-13',
  'U-15',
  'U-17',
  'U-19',
  'U-21',
  'Seniors',
])

// Query parameters for GET /training-sessions
export const trainingSessionsQuerySchema = z
  .object({
    ...standardTextSearchSchema.shape,
    ...standardPaginationSchema.shape,
    ...standardSortSchema.shape,
    intensity: z.enum(['high', 'normal', 'low', 'all']).optional(),
    type: sessionTypeEnum.optional(),
    dateFrom: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    dateTo: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    ageGroup: ageGroupEnum.optional(),
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
      .enum(['name', 'intensity', 'date', 'createdAt', 'updatedAt'])
      .optional(),
  })
  .strict()

// Route parameters for GET /training-sessions/:id
export const trainingSessionsParamsSchema = z.object({
  id: uuidSchema,
})

// Create training session schema for POST /training-sessions
export const trainingSessionsCreateSchema = z
  .object({
    name: nameSchema.optional(),
    intensity: z
      .enum(['high', 'normal', 'low'], {
        message: 'Intensity must be high, normal, or low',
      })
      .optional(),
    type: z.array(sessionTypeEnum).min(1, 'At least one type is required'),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
    description: z.string().optional(),
    ageGroups: z
      .array(ageGroupEnum)
      .min(1, 'At least one age group is required'),
    coachIds: z.array(uuidSchema).min(1, 'At least one coach is required'),
    organizationId: optionalUuidSchema,
    teamLevels: z
      .array(teamLevelEnum)
      .optional()
      .describe(
        'Array of team levels to filter players by. Empty or omitted means all team levels.'
      ),
    autoCreateAttendance: z.boolean().optional().default(false),
  })
  .strict()

// Update training session schema for PATCH /training-sessions/:id
export const trainingSessionsUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    intensity: z
      .enum(['high', 'normal', 'low'], {
        message: 'Intensity must be high, normal, or low',
      })
      .optional(),
    type: z.array(sessionTypeEnum).optional(),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
      .optional(),
    description: z.string().optional().nullable(),
    ageGroups: z.array(ageGroupEnum).optional(),
    coachIds: z
      .array(uuidSchema)
      .min(1, 'At least one coach is required')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

// Attendance Status Enum
export const attendanceStatusEnum = z.enum([
  'pending',
  'present',
  'late',
  'absent_excused',
  'absent_unexcused',
  'suspended',
])

// Attendance route parameters schema (for routes where playerId is optional)
export const attendanceParamsSchema = z.object({
  id: uuidSchema,
  playerId: uuidSchema.optional(),
})

// Attendance route parameters schema (for routes where playerId is required)
export const attendanceParamsWithPlayerSchema = z.object({
  id: uuidSchema,
  playerId: uuidSchema,
})

// Create attendance schema for POST /training-sessions/:id/attendance
export const attendanceCreateSchema = z
  .object({
    playerId: uuidSchema,
    status: attendanceStatusEnum.optional().default('pending'),
  })
  .strict()

// Update attendance schema for PATCH /training-sessions/:id/attendance/:playerId
export const attendanceUpdateSchema = z
  .object({
    status: attendanceStatusEnum,
  })
  .strict()

// Bulk update attendance schema for PATCH /training-sessions/:id/attendance/bulk
export const attendanceBulkUpdateSchema = z
  .object({
    updates: z
      .array(
        z.object({
          playerId: uuidSchema,
          status: attendanceStatusEnum,
        })
      )
      .min(1, 'At least one update is required'),
  })
  .strict()

// Bulk delete attendance schema for DELETE /training-sessions/:id/attendance/bulk
export const attendanceBulkDeleteSchema = z
  .object({
    playerIds: z.array(uuidSchema).min(1, 'At least one player ID is required'),
  })
  .strict()

// Inferred TypeScript types
export type TrainingSessionsQuery = z.infer<typeof trainingSessionsQuerySchema>
export type TrainingSessionsParams = z.infer<
  typeof trainingSessionsParamsSchema
>
export type TrainingSessionsCreate = z.infer<
  typeof trainingSessionsCreateSchema
>
export type TrainingSessionsUpdate = z.infer<
  typeof trainingSessionsUpdateSchema
>
export type AttendanceParams = z.infer<typeof attendanceParamsSchema>
export type AttendanceParamsWithPlayer = z.infer<
  typeof attendanceParamsWithPlayerSchema
>
export type AttendanceCreate = z.infer<typeof attendanceCreateSchema>
export type AttendanceUpdate = z.infer<typeof attendanceUpdateSchema>
export type AttendanceBulkUpdate = z.infer<typeof attendanceBulkUpdateSchema>
export type AttendanceBulkDelete = z.infer<typeof attendanceBulkDeleteSchema>
