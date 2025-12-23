import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  CoachResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  checkOrganizationAccess,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create coaches
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT create)
 * - Must have an active organization (unless system admin)
 */
export function checkCoachCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (coaches cannot create other coaches)
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  if ((!isSystemAdmin && !isAdmin && !isOwner) || isCoach) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can create coaches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}

/**
 * Check if user has authorization to read/view a coach
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkCoachReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to update a coach
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT update)
 * - Must have an active organization (unless system admin)
 * - Coach must belong to user's organization (unless system admin)
 */
export function checkCoachUpdateAuthorization(
  context: OrganizationContext,
  coach: CoachResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (coaches cannot update other coaches)
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  if ((!isSystemAdmin && !isAdmin && !isOwner) || isCoach) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can update coaches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership
  const ownershipCheck = checkOrganizationAccess(
    context,
    coach.organizationId,
    'You can only update coaches from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a coach
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Coach must belong to user's organization (unless system admin)
 */
export function checkCoachDeleteAuthorization(
  context: OrganizationContext,
  coach: CoachResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (coaches cannot delete other coaches)
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  if ((!isSystemAdmin && !isAdmin && !isOwner) || isCoach) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete coaches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership
  const ownershipCheck = checkOrganizationAccess(
    context,
    coach.organizationId,
    'You can only delete coaches from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
