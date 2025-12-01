import { z } from 'zod'
import { TEAM_LEVELS } from '@/types/team-level'

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
    q: z
      .string()
      .trim()
      .max(20, 'q must be less than 20 characters')
      .optional(),
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
    // Sorting parameters
    sortBy: z
      .enum(['name', 'intensity', 'date', 'createdAt', 'updatedAt'])
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

// Route parameters for GET /training-sessions/:id
export const trainingSessionsParamsSchema = z.object({
  id: z.uuid('Invalid training session ID format'),
})

// Create training session schema for POST /training-sessions
export const trainingSessionsCreateSchema = z
  .object({
    name: z.string().max(255, 'Name is too long').optional(),
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
    coachIds: z
      .array(z.uuid('Invalid coach ID format'))
      .min(1, 'At least one coach is required'),
    organizationId: z
      .uuid('Invalid organization ID format')
      .optional()
      .nullable(),
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
    name: z.string().max(255, 'Name is too long').optional(),
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
      .array(z.uuid('Invalid coach ID format'))
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
  id: z.uuid('Invalid training session ID format'),
  playerId: z.uuid('Invalid player ID format').optional(),
})

// Attendance route parameters schema (for routes where playerId is required)
export const attendanceParamsWithPlayerSchema = z.object({
  id: z.uuid('Invalid training session ID format'),
  playerId: z.uuid('Invalid player ID format'),
})

// Create attendance schema for POST /training-sessions/:id/attendance
export const attendanceCreateSchema = z
  .object({
    playerId: z.uuid('Invalid player ID format'),
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
          playerId: z.uuid('Invalid player ID format'),
          status: attendanceStatusEnum,
        })
      )
      .min(1, 'At least one update is required'),
  })
  .strict()

// Bulk delete attendance schema for DELETE /training-sessions/:id/attendance/bulk
export const attendanceBulkDeleteSchema = z
  .object({
    playerIds: z
      .array(z.uuid('Invalid player ID format'))
      .min(1, 'At least one player ID is required'),
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
