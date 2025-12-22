import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  RegistrationResource,
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
 * Check if user has authorization to create registrations
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Inherits from parent event's create authorization
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkRegistrationCreateAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create registrations'
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
    'You can only create registrations for events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to read/view a registration
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Registrations inherit visibility from their parent event
 */
export function checkRegistrationReadAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Registrations inherit read permissions from their parent event
  // This should be checked at the event level
  return null
}

/**
 * Check if user has authorization to update a registration
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Registration's event must belong to user's organization (unless system admin)
 */
export function checkRegistrationUpdateAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update registrations'
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
    'You can only update registrations for events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a registration
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Note: Coaches CAN delete registrations (different from deleting events)
 * - Must have an active organization (unless system admin)
 * - Registration's event must belong to user's organization (unless system admin)
 */
export function checkRegistrationDeleteAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (coaches CAN delete registrations)
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can delete registrations'
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
    'You can only delete registrations from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
