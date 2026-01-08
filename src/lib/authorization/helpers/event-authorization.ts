import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  EventResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
  requireOrganization,
  checkOrganizationAccess,
  hasCoachPermissions,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create events
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can create events for any organization or global events
 * - Organization members (admin/owner/coach) can create events for their organization
 * - Federation admins/editors can create events for championship editions in their federation
 * - Organization members must have an active organization (unless creating for championship edition)
 */
export function checkEventCreateAuthorization(
  context: OrganizationContext,
  championshipFederationId?: string | null
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // If creating event for championship edition, check federation authorization
  if (championshipFederationId) {
    // System admins can create events for any championship edition
    if (isSystemAdmin(context)) {
      return null
    }

    // Federation admins/editors can create events for championship editions in their federation
    const { isFederationAdmin, isFederationEditor, federationId } = context
    if (
      (isFederationAdmin || isFederationEditor) &&
      federationId === championshipFederationId
    ) {
      return null
    }

    return forbiddenResponse(
      'Only system admins and federation admins/editors can create events for championship editions in their federation'
    )
  }

  // For regular events (not championship events), use organization-based authorization
  // Only system admins, org admins, org owners, and org coaches can create events
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create events'
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
 * Check if user has authorization to read/view an event
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - System admin: can see all events
 * - Org members: can see their org events (public + private) + public events + events without org
 * - Non-authenticated: can see public events + events without org
 */
export function checkEventReadAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // System admin: can see all events
  if (isSystemAdmin(context)) {
    return null
  }

  const isPublic = event.visibility === 'public'
  const hasNoOrganization = event.organizationId === null
  const isFromUserOrg =
    context.organization?.id && event.organizationId === context.organization.id

  // Allow if: public OR no organization OR from user's org
  // Block if: private AND has organization AND not from user's org
  if (!isPublic && !hasNoOrganization && !isFromUserOrg) {
    return forbiddenResponse('Forbidden')
  }

  return null
}

/**
 * Check if user has authorization to update an event
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any event
 * - Organization members (admin/owner/coach) can update events from their organization
 * - Federation admins/editors can update events for championship editions in their federation
 * - Organization members must have an active organization (unless updating championship event)
 */
export function checkEventUpdateAuthorization(
  context: OrganizationContext,
  event: EventResource,
  championshipFederationId?: string | null
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any event
  if (isSystemAdmin(context)) {
    return null
  }

  // If event belongs to a championship edition, check federation authorization
  if (championshipFederationId) {
    // Federation admins/editors can update events for championship editions in their federation
    const { isFederationAdmin, isFederationEditor, federationId } = context
    if (
      (isFederationAdmin || isFederationEditor) &&
      federationId === championshipFederationId
    ) {
      return null
    }

    return forbiddenResponse(
      'Only system admins and federation admins/editors can update events for championship editions in their federation'
    )
  }

  // For regular events (not championship events), use organization-based authorization
  // Only org admins, org owners, and org coaches can update events
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update events'
    )
  }

  // Non-system admins must have an active organization
  const orgCheck = requireOrganization(context)
  if (orgCheck) return orgCheck

  // Organization ownership check: org members can only update events from their own organization
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only update events from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete an event
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can delete any event
 * - For championship edition events: only federation admins can delete (not federation editors)
 * - For regular events: organization admins/owners can delete events from their organization
 * - Coaches cannot delete events (only admins/owners)
 * - Organization members must have an active organization (unless deleting championship event)
 */
export function checkEventDeleteAuthorization(
  context: OrganizationContext,
  event: EventResource,
  championshipFederationId?: string | null
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can delete any event
  if (isSystemAdmin(context)) {
    return null
  }

  // If event belongs to a championship edition, only federation admins can delete
  if (championshipFederationId) {
    const { isFederationAdmin, federationId } = context
    if (isFederationAdmin && federationId === championshipFederationId) {
      return null
    }

    return forbiddenResponse(
      'Only system admins and federation admins can delete events for championship editions in their federation'
    )
  }

  // For regular events (not championship events), use organization-based authorization
  // Only org admins and org owners can delete events (coaches cannot)
  if (!context.isAdmin && !context.isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete events'
    )
  }

  // Non-system admins must have an active organization
  const orgCheck = requireOrganization(context)
  if (orgCheck) return orgCheck

  // Organization ownership check: org members can only delete events from their own organization
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only delete events from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
