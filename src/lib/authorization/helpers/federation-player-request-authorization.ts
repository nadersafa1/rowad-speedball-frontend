import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

export interface FederationPlayerRequestResource {
  id: string
  federationId: string
  playerId: string
  organizationId: string
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Check if user has authorization to create federation player requests
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be organization owner or admin
 * - Must have an organizationId in context
 */
export function checkFederationPlayerRequestCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Must be part of an organization
  if (!context.organization?.id) {
    return forbiddenResponse(
      'You must be part of an organization to request player federation membership'
    )
  }

  // Only organization owners/admins can create requests
  if (!context.isOwner && !context.isAdmin) {
    return forbiddenResponse(
      'Only organization owners/admins can request player federation membership'
    )
  }

  return null
}

/**
 * Check if user has authorization to read/view federation player requests
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can see all requests
 * - Federation admins/editors can see requests for their federation
 * - Organization owners/admins can see requests from their organization
 */
export function checkFederationPlayerRequestReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can see all requests
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins/editors can see their federation's requests
  if (
    (context.isFederationAdmin || context.isFederationEditor) &&
    context.federationId
  ) {
    return null
  }

  // Organization owners/admins can see their organization's requests
  if ((context.isOwner || context.isAdmin) && context.organization?.id) {
    return null
  }

  return forbiddenResponse(
    'You do not have permission to view federation player requests'
  )
}

/**
 * Check if user has authorization to update (approve/reject) a federation player request
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any request
 * - Federation admins/editors can update requests for their federation
 */
export function checkFederationPlayerRequestUpdateAuthorization(
  context: OrganizationContext,
  request: FederationPlayerRequestResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any request
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins/editors can approve/reject requests for their federation
  if (
    (context.isFederationAdmin || context.isFederationEditor) &&
    context.federationId === request.federationId
  ) {
    return null
  }

  return forbiddenResponse(
    'Only federation admins/editors can approve or reject player requests'
  )
}

/**
 * Check if user has authorization to delete a federation player request
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can delete any request
 * - Federation admins can delete requests for their federation
 * - Organization owners/admins can delete their own pending requests only
 */
export function checkFederationPlayerRequestDeleteAuthorization(
  context: OrganizationContext,
  request: FederationPlayerRequestResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can delete any request
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins can delete requests for their federation
  if (context.isFederationAdmin && context.federationId === request.federationId) {
    return null
  }

  // Organization owners/admins can delete their own pending requests
  if (
    (context.isOwner || context.isAdmin) &&
    context.organization?.id === request.organizationId &&
    request.status === 'pending'
  ) {
    return null
  }

  return forbiddenResponse(
    'You do not have permission to delete this request'
  )
}
