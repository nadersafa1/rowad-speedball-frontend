// Season-related Zod validation schemas
import { z } from 'zod'

// ============================================================================
// Season Schemas
// ============================================================================

export const seasonStatusEnum = z.enum([
  'draft',
  'active',
  'closed',
  'archived',
])

export const createSeasonSchema = z
  .object({
    federationId: z.uuid('Invalid federation ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    startYear: z
      .number()
      .int('Start year must be an integer')
      .min(2000, 'Start year must be 2000 or later')
      .max(2100, 'Start year must be before 2100'),
    endYear: z
      .number()
      .int('End year must be an integer')
      .min(2000, 'End year must be 2000 or later')
      .max(2100, 'End year must be before 2100'),
    seasonStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid season start date',
    }),
    seasonEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid season end date',
    }),
    firstRegistrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid first registration start date',
      })
      .optional()
      .nullable(),
    firstRegistrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid first registration end date',
      })
      .optional()
      .nullable(),
    secondRegistrationStartDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid second registration start date',
      })
      .optional()
      .nullable(),
    secondRegistrationEndDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid second registration end date',
      })
      .optional()
      .nullable(),
    maxAgeGroupsPerPlayer: z
      .number()
      .int('Max age groups must be an integer')
      .min(1, 'Must allow at least 1 age group per player')
      .default(1),
    status: seasonStatusEnum.default('draft'),
  })
  .refine((data) => data.endYear === data.startYear + 1, {
    message: 'End year must be exactly 1 year after start year',
    path: ['endYear'],
  })
  .refine(
    (data) => new Date(data.seasonEndDate) > new Date(data.seasonStartDate),
    {
      message: 'Season end date must be after start date',
      path: ['seasonEndDate'],
    }
  )

export const updateSeasonSchema = createSeasonSchema
  .partial()
  .omit({ federationId: true })

export const seasonQueryParamsSchema = z.object({
  federationId: z.uuid().optional(),
  status: seasonStatusEnum.optional(),
  year: z.coerce.number().int().optional(), // Filter by year (matches startYear or endYear)
  sortBy: z
    .enum(['name', 'startYear', 'seasonStartDate', 'createdAt', 'updatedAt'])
    .default('startYear'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// ============================================================================
// Season Age Group Schemas
// ============================================================================

export const createSeasonAgeGroupSchema = z
  .object({
    seasonId: z.uuid('Invalid season ID'),
    code: z
      .string()
      .min(1, 'Code is required')
      .max(20, 'Code too long')
      .regex(
        /^[A-Z0-9-]+$/,
        'Code must contain only uppercase letters, numbers, and hyphens'
      ),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    minAge: z
      .number()
      .int('Min age must be an integer')
      .min(0, 'Min age cannot be negative')
      .max(150, 'Min age too high')
      .optional()
      .nullable(),
    maxAge: z
      .number()
      .int('Max age must be an integer')
      .min(0, 'Max age cannot be negative')
      .max(150, 'Max age too high')
      .optional()
      .nullable(),
    displayOrder: z.number().int('Display order must be an integer').default(0),
  })
  .refine(
    (data) => {
      if (data.minAge != null && data.maxAge != null) {
        return data.maxAge >= data.minAge
      }
      return true
    },
    {
      message: 'Max age must be greater than or equal to min age',
      path: ['maxAge'],
    }
  )

export const updateSeasonAgeGroupSchema = createSeasonAgeGroupSchema
  .partial()
  .omit({ seasonId: true })

export const seasonAgeGroupQueryParamsSchema = z.object({
  seasonId: z.uuid().optional(),
  sortBy: z
    .enum(['displayOrder', 'code', 'name', 'createdAt'])
    .default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// Federation Member Schemas
// ============================================================================

export const federationMemberStatusEnum = z.enum([
  'active',
  'suspended',
  'revoked',
])

export const createFederationMemberSchema = z.object({
  federationId: z.uuid('Invalid federation ID'),
  playerId: z.uuid('Invalid player ID'),
  federationIdNumber: z
    .string()
    .min(1, 'Federation ID number is required')
    .max(50, 'Federation ID number too long')
    .regex(
      /^[A-Z0-9-]+$/,
      'ID must contain only uppercase letters, numbers, and hyphens'
    ),
  firstRegistrationSeasonId: z.uuid('Invalid season ID'),
  status: federationMemberStatusEnum.default('active'),
})

export const updateFederationMemberSchema = z.object({
  federationIdNumber: z
    .string()
    .min(1, 'Federation ID number is required')
    .max(50, 'Federation ID number too long')
    .regex(
      /^[A-Z0-9-]+$/,
      'ID must contain only uppercase letters, numbers, and hyphens'
    )
    .optional(),
  status: federationMemberStatusEnum.optional(),
})

export const federationMemberQueryParamsSchema = z.object({
  federationId: z.uuid().optional(),
  playerId: z.uuid().optional(),
  status: federationMemberStatusEnum.optional(),
  search: z.string().optional(), // Search by federation ID number or player name
  sortBy: z
    .enum([
      'firstRegistrationDate',
      'federationIdNumber',
      'createdAt',
      'updatedAt',
    ])
    .default('firstRegistrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// ============================================================================
// Season Player Registration Schemas
// ============================================================================

export const registrationStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
])
export const paymentStatusEnum = z.enum(['unpaid', 'paid', 'refunded'])
export const ageWarningTypeEnum = z.enum([
  'too_young',
  'too_old',
  'outside_range',
])

export const createSeasonPlayerRegistrationSchema = z.object({
  seasonId: z.uuid('Invalid season ID'),
  playerId: z.uuid('Invalid player ID'),
  seasonAgeGroupId: z.uuid('Invalid age group ID'),
  organizationId: z.uuid('Invalid organization ID'),
  playerAgeAtRegistration: z
    .number()
    .int('Player age must be an integer')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age too high'),
  ageWarningShown: z.boolean().default(false).optional(),
  ageWarningType: ageWarningTypeEnum.optional().nullable(),
  paymentAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid payment amount')
    .optional()
    .nullable(),
})

export const bulkCreateSeasonPlayerRegistrationsSchema = z.object({
  seasonId: z.uuid('Invalid season ID'),
  playerIds: z
    .array(z.uuid('Invalid player ID'))
    .min(1, 'At least one player is required')
    .max(100, 'Cannot register more than 100 players at once'),
  seasonAgeGroupIds: z
    .array(z.uuid('Invalid age group ID'))
    .min(1, 'At least one age group is required'),
  organizationId: z.uuid('Invalid organization ID'),
})

export const updateSeasonPlayerRegistrationStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  rejectionReason: z
    .string()
    .max(500, 'Rejection reason too long')
    .optional()
    .nullable(),
  paymentStatus: paymentStatusEnum.optional(),
  paymentAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid payment amount')
    .optional()
    .nullable(),
})

export const seasonPlayerRegistrationQueryParamsSchema = z.object({
  seasonId: z.uuid().optional(),
  playerId: z.uuid().optional(),
  seasonAgeGroupId: z.uuid().optional(),
  organizationId: z.uuid().optional(),
  status: registrationStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  sortBy: z
    .enum([
      'registrationDate',
      'approvedAt',
      'playerName',
      'createdAt',
      'updatedAt',
    ])
    .default('registrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>
export type SeasonQueryParams = z.infer<typeof seasonQueryParamsSchema>

export type CreateSeasonAgeGroupInput = z.infer<
  typeof createSeasonAgeGroupSchema
>
export type UpdateSeasonAgeGroupInput = z.infer<
  typeof updateSeasonAgeGroupSchema
>
export type SeasonAgeGroupQueryParams = z.infer<
  typeof seasonAgeGroupQueryParamsSchema
>

export type CreateFederationMemberInput = z.infer<
  typeof createFederationMemberSchema
>
export type UpdateFederationMemberInput = z.infer<
  typeof updateFederationMemberSchema
>
export type FederationMemberQueryParams = z.infer<
  typeof federationMemberQueryParamsSchema
>

export type CreateSeasonPlayerRegistrationInput = z.infer<
  typeof createSeasonPlayerRegistrationSchema
>
export type BulkCreateSeasonPlayerRegistrationsInput = z.infer<
  typeof bulkCreateSeasonPlayerRegistrationsSchema
>
export type UpdateSeasonPlayerRegistrationStatusInput = z.infer<
  typeof updateSeasonPlayerRegistrationStatusSchema
>
export type SeasonPlayerRegistrationQueryParams = z.infer<
  typeof seasonPlayerRegistrationQueryParamsSchema
>
