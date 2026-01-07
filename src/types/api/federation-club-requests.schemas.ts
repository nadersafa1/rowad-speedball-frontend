import { z } from 'zod'

// Base schema for creating a federation club request
export const createFederationClubRequestSchema = z.object({
  federationId: z.uuid('Invalid federation ID'),
})

// Schema for approving/rejecting a request
export const updateFederationClubRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
})

// Query schema for listing federation club requests
export const federationClubRequestsQuerySchema = z.object({
  federationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid federation ID format'
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

export type CreateFederationClubRequestInput = z.infer<
  typeof createFederationClubRequestSchema
>
export type UpdateFederationClubRequestStatusInput = z.infer<
  typeof updateFederationClubRequestStatusSchema
>
export type FederationClubRequestsQuery = z.infer<
  typeof federationClubRequestsQuerySchema
>
