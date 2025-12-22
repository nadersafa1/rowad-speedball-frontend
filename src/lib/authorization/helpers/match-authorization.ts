import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  MatchResource,
  EventResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  hasCoachPermissions,
  forbiddenResponse,
  isSystemAdmin,
  checkOrganizationAccess,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create matches
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkMatchCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create matches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}

/**
 * Check if user has authorization to read/view a match
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Matches inherit visibility from their parent event
 * - Use checkEventReadAuthorization for parent event
 */
export function checkMatchReadAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Matches inherit read permissions from their parent event
  // This should be checked at the event level
  return null
}

/**
 * Check if user has authorization to update a match
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Match's event must belong to user's organization (unless system admin)
 */
export function checkMatchUpdateAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update matches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership via parent event
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only update matches from events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a match
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Match's event must belong to user's organization (unless system admin)
 */
export function checkMatchDeleteAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (more restrictive - no coaches)
  const { isSystemAdmin, isAdmin, isOwner } = context
  if (!isSystemAdmin && !isAdmin && !isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete matches'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership via parent event
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only delete matches from events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
