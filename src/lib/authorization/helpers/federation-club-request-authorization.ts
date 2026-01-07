import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

export interface FederationClubRequestResource {
  id: string
  federationId: string
  organizationId: string
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Check if user has authorization to create federation club requests
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be organization owner or admin
 * - Must have an organizationId in context
 */
export function checkFederationClubRequestCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Must be part of an organization
  if (!context.organization?.id) {
    return forbiddenResponse('You must be part of an organization to join a federation')
  }

  // Only organization owners/admins can create requests
  if (!context.isOwner && !context.isAdmin) {
    return forbiddenResponse(
      'Only organization owners/admins can request to join a federation'
    )
  }

  return null
}

/**
 * Check if user has authorization to read/view federation club requests
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can see all requests
 * - Federation admins/editors can see requests for their federation
 * - Organization owners/admins can see requests from their organization
 */
export function checkFederationClubRequestReadAuthorization(
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
    'You do not have permission to view federation club requests'
  )
}

/**
 * Check if user has authorization to update (approve/reject) a federation club request
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any request
 * - Federation admins can update requests for their federation
 */
export function checkFederationClubRequestUpdateAuthorization(
  context: OrganizationContext,
  request: FederationClubRequestResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any request
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins can approve/reject requests for their federation
  if (context.isFederationAdmin && context.federationId === request.federationId) {
    return null
  }

  return forbiddenResponse(
    'Only federation admins can approve or reject club requests'
  )
}

/**
 * Check if user has authorization to delete a federation club request
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can delete any request
 * - Federation admins can delete requests for their federation
 * - Organization owners/admins can delete their own pending requests only
 */
export function checkFederationClubRequestDeleteAuthorization(
  context: OrganizationContext,
  request: FederationClubRequestResource
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
