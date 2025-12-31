import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult, GroupResource } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
  requireOrganization,
  hasCoachPermissions,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create groups
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can create groups for any event
 * - Organization members (admin/owner/coach) can create groups for events in their organization
 * - Organization members must have an active organization
 */
export function checkGroupCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins, org admins, org owners, and org coaches can create groups
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create groups'
    )
  }

  // Non-system admins must have an active organization
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}

/**
 * Check if user has authorization to read/view a group
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Groups inherit visibility from their parent event
 * - System admin: can see all groups
 * - Org members: can see groups from their org events
 * - Public: can see groups from public events
 *
 * Note: This check should be combined with parent event authorization
 */
export function checkGroupReadAuthorization(
  context: OrganizationContext,
  group: GroupResource
): AuthorizationResult {
  // Groups are generally readable if the parent event is readable
  // The parent event authorization check handles the actual visibility logic
  return null
}

/**
 * Check if user has authorization to update a group
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any group
 * - Organization members (admin/owner/coach) can update groups from events in their organization
 * - Organization members must have an active organization
 */
export function checkGroupUpdateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins, org admins, org owners, and org coaches can update groups
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update groups'
    )
  }

  // Non-system admins must have an active organization
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}

/**
 * Check if user has authorization to delete a group
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can delete any group
 * - Organization admins/owners can delete groups from events in their organization
 * - Coaches cannot delete groups (only admins/owners)
 * - Organization members must have an active organization
 */
export function checkGroupDeleteAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins, org admins, and org owners can delete groups
  if (!isSystemAdmin(context) && !context.isAdmin && !context.isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete groups'
    )
  }

  // Non-system admins must have an active organization
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}
