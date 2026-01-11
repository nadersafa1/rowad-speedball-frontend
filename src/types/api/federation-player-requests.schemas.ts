import { z } from 'zod'

// Base schema for creating a federation player request
export const createFederationPlayerRequestSchema = z.object({
  federationId: z.uuid('Invalid federation ID'),
  playerId: z.uuid('Invalid player ID'),
})

// Schema for approving/rejecting a request
export const updateFederationPlayerRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
  federationRegistrationNumber: z.string().optional(),
})

// Query schema for listing federation player requests
export const federationPlayerRequestsQuerySchema = z.object({
  federationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid federation ID format'
    ),
  playerId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid player ID format'
    ),
  organizationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid organization ID format'
    ),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  sortBy: z
    .enum(['requestedAt', 'respondedAt', 'createdAt', 'updatedAt'])
    .optional()
    .default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
})

export type CreateFederationPlayerRequestInput = z.infer<
  typeof createFederationPlayerRequestSchema
>
export type UpdateFederationPlayerRequestStatusInput = z.infer<
  typeof updateFederationPlayerRequestStatusSchema
>
export type FederationPlayerRequestsQuery = z.infer<
  typeof federationPlayerRequestsQuerySchema
>
