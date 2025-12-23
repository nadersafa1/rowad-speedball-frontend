import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  TestResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  hasCoachPermissions,
  checkOrganizationAccess,
  forbiddenResponse,
  isSystemAdmin,
  belongsToUserOrganization,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create tests
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkTestCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create tests'
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
 * Check if user has authorization to read/view a test
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - System admin: can see all tests
 * - Org members: can see their org tests (public + private) + public tests + tests without org
 * - Non-authenticated: can see public tests + tests without org
 */
export function checkTestReadAuthorization(
  context: OrganizationContext,
  test: TestResource | null
): AuthorizationResult {
  // System admin: can see all tests
  if (isSystemAdmin(context)) {
    return null
  }

  // If test is null, allow (will be handled as 404 later)
  if (!test) {
    return null
  }

  const isPublic = test.visibility === 'public'
  const hasNoOrganization = test.organizationId === null
  const isFromUserOrg = belongsToUserOrganization(context, test.organizationId)

  // Allow if: public OR no organization OR from user's org
  // Block if: private AND has organization AND not from user's org
  if (!isPublic && !hasNoOrganization && !isFromUserOrg) {
    return forbiddenResponse('Forbidden')
  }

  return null
}

/**
 * Check if user has authorization to update a test
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Test must belong to user's organization (unless system admin)
 */
export function checkTestUpdateAuthorization(
  context: OrganizationContext,
  test: TestResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update tests'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership
  const ownershipCheck = checkOrganizationAccess(
    context,
    test.organizationId,
    'You can only update tests from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a test
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Test must belong to user's organization (unless system admin)
 */
export function checkTestDeleteAuthorization(
  context: OrganizationContext,
  test: TestResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (more restrictive - no coaches)
  const { isSystemAdmin, isAdmin, isOwner } = context
  if (!isSystemAdmin && !isAdmin && !isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete tests'
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
    test.organizationId,
    'You can only delete tests from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
