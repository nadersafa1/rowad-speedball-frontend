import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  forbiddenResponse,
  isSystemAdmin,
  hasAdminPermissions,
} from '@/lib/authorization/types'

export interface SeasonRegistrationResource {
  id: string
  organizationId: string | null
  seasonId: string
  playerId: string
  status: string
}

/**
 * Check if user has authorization to create season registrations
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner
 * - Must have an active organization (unless system admin)
 */
export function checkSeasonRegistrationCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasAdminPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can create season registrations'
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
 * Check if user has authorization to read/view season registrations
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Organization members can view their own organization's registrations
 * - Federation admins can view all registrations in their federation
 * - System admins can view all registrations
 */
export function checkSeasonRegistrationReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Public access for authenticated users
  // Filtering is handled by the API route based on organization/federation context
  return null
}

/**
 * Check if user has authorization to update a season registration (approve/reject)
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be federation admin, federation editor, or system admin
 */
export function checkSeasonRegistrationUpdateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions - only federation admins can approve/reject
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context
  if (!isSystemAdmin && !isFederationAdmin && !isFederationEditor) {
    return forbiddenResponse(
      'Only system admins and federation admins can approve or reject season registrations'
    )
  }

  return null
}

/**
 * Check if user has authorization to delete a season registration
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Organization admins can delete their own organization's pending registrations
 * - Federation admins can delete any registration
 * - System admins can delete any registration
 */
export function checkSeasonRegistrationDeleteAuthorization(
  context: OrganizationContext,
  registration: SeasonRegistrationResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  const { isSystemAdmin, isFederationAdmin, isAdmin, isOwner, organization } = context

  // System admins and federation admins can delete any registration
  if (isSystemAdmin || isFederationAdmin) {
    return null
  }

  // Organization admins can only delete their own organization's registrations
  if (isAdmin || isOwner) {
    if (registration.organizationId !== organization?.id) {
      return forbiddenResponse(
        'You can only delete registrations from your own organization'
      )
    }

    // Only allow deletion of pending or cancelled registrations
    if (registration.status !== 'pending' && registration.status !== 'cancelled') {
      return forbiddenResponse(
        'You can only delete pending or cancelled registrations'
      )
    }

    return null
  }

  return forbiddenResponse(
    'Only system admins, federation admins, club admins, and club owners can delete season registrations'
  )
}

/**
 * Check if user has authorization to approve a season registration
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be federation admin or system admin
 */
export function checkSeasonRegistrationApprovalAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions - only federation admins can approve
  const { isSystemAdmin, isFederationAdmin } = context
  if (!isSystemAdmin && !isFederationAdmin) {
    return forbiddenResponse(
      'Only system admins and federation admins can approve season registrations'
    )
  }

  return null
}
