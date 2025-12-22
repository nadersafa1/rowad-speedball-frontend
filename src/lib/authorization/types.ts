import type { OrganizationContext } from '@/lib/organization-helpers'
import type * as schema from '@/db/schema'

/**
 * Standard authorization check result
 * Returns Response if unauthorized, null if authorized
 */
export type AuthorizationResult = ReturnType<typeof Response.json> | null

/**
 * Common resource types for authorization
 */
export type PlayerResource = typeof schema.players.$inferSelect
export type CoachResource = typeof schema.coaches.$inferSelect
export type EventResource = typeof schema.events.$inferSelect
export type TrainingSessionResource =
  typeof schema.trainingSessions.$inferSelect
export type TestResource = typeof schema.tests.$inferSelect
export type ResultResource = typeof schema.testResults.$inferSelect
export type MatchResource = typeof schema.matches.$inferSelect
export type SetResource = typeof schema.sets.$inferSelect
export type RegistrationResource = typeof schema.registrations.$inferSelect
export type ChampionshipResource = typeof schema.championships.$inferSelect
export type FederationResource = typeof schema.federations.$inferSelect
export type OrganizationResource = typeof schema.organization.$inferSelect
export type UserResource = typeof schema.user.$inferSelect
export type PlayerNoteResource = typeof schema.playerNotes.$inferSelect

/**
 * Standard error messages for authorization
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  ORG_REQUIRED: 'Active organization required',
  WRONG_ORG: 'Resource belongs to a different organization',
} as const

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(
  message: string = AUTH_ERRORS.UNAUTHORIZED
): Response {
  return Response.json({ message }, { status: 401 })
}

/**
 * Helper to create forbidden response
 */
export function forbiddenResponse(
  message: string = AUTH_ERRORS.FORBIDDEN
): Response {
  return Response.json({ message }, { status: 403 })
}

/**
 * Helper to create not found response
 */
export function notFoundResponse(
  message: string = AUTH_ERRORS.NOT_FOUND
): Response {
  return Response.json({ message }, { status: 404 })
}

/**
 * Check if user is authenticated
 */
export function requireAuthentication(
  context: OrganizationContext
): AuthorizationResult {
  if (!context.isAuthenticated) {
    return unauthorizedResponse()
  }
  return null
}

/**
 * Check if user has an active organization
 */
export function requireOrganization(
  context: OrganizationContext
): AuthorizationResult {
  if (!context.organization?.id) {
    return forbiddenResponse(AUTH_ERRORS.ORG_REQUIRED)
  }
  return null
}

/**
 * Check if user is system admin
 */
export function isSystemAdmin(context: OrganizationContext): boolean {
  return context.isSystemAdmin
}

/**
 * Check if user has admin-level permissions (system admin, owner, or admin)
 */
export function hasAdminPermissions(context: OrganizationContext): boolean {
  return context.isSystemAdmin || context.isAdmin || context.isOwner
}

/**
 * Check if user has coach-level permissions (admin-level + coach)
 */
export function hasCoachPermissions(context: OrganizationContext): boolean {
  return hasAdminPermissions(context) || context.isCoach
}

/**
 * Check if resource belongs to user's organization
 */
export function belongsToUserOrganization(
  context: OrganizationContext,
  resourceOrgId: string | null | undefined
): boolean {
  if (!context.organization?.id || !resourceOrgId) {
    return false
  }
  return context.organization.id === resourceOrgId
}

/**
 * Check if user can access resource based on organization ownership
 * System admins can access any resource
 * Other users can only access resources from their organization
 */
export function checkOrganizationAccess(
  context: OrganizationContext,
  resourceOrgId: string | null | undefined,
  customMessage?: string
): AuthorizationResult {
  if (isSystemAdmin(context)) {
    return null
  }

  if (!belongsToUserOrganization(context, resourceOrgId)) {
    return forbiddenResponse(customMessage || AUTH_ERRORS.WRONG_ORG)
  }

  return null
}
