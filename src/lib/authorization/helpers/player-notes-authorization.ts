import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  PlayerResource,
  PlayerNoteResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
  hasCoachPermissions,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to read player notes
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can read all notes
 * - Organization members (admin/owner/coach) can read notes for their org's players
 */
export function checkPlayerNotesReadAuthorization(
  context: OrganizationContext,
  player: PlayerResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can read all notes
  if (isSystemAdmin(context)) return null

  // Org members can read notes for their org's players
  if (
    hasCoachPermissions(context) &&
    context.organization?.id === player.organizationId
  ) {
    return null
  }

  return forbiddenResponse(
    'You can only view notes for players in your organization'
  )
}

/**
 * Check if user has authorization to create player notes
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can create notes on any player
 * - Organization members (admin/owner/coach) can create notes for their org's players
 */
export function checkPlayerNotesCreateAuthorization(
  context: OrganizationContext,
  player: PlayerResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can create notes on any player
  if (isSystemAdmin(context)) return null

  // Org members can create notes for their org's players
  if (
    hasCoachPermissions(context) &&
    context.organization?.id === player.organizationId
  ) {
    return null
  }

  return forbiddenResponse(
    'Only organization admins, owners, and coaches can create notes for players in their organization'
  )
}

/**
 * Check if user has authorization to update a player note
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any note
 * - Note creator can update their own note
 */
export function checkPlayerNoteUpdateAuthorization(
  context: OrganizationContext,
  note: PlayerNoteResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any note
  if (isSystemAdmin(context)) return null

  // Note creator can update their own note
  if (context.userId === note.createdBy) return null

  return forbiddenResponse('You can only edit notes you created')
}

/**
 * Check if user has authorization to delete a player note
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can delete any note
 * - Note creator can delete their own note
 * - Organization admins/owners can delete notes in their organization
 */
export function checkPlayerNoteDeleteAuthorization(
  context: OrganizationContext,
  note: PlayerNoteResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can delete any note
  if (isSystemAdmin(context)) return null

  // Note creator can delete their own note
  if (context.userId === note.createdBy) return null

  // Org admins/owners can delete notes in their org
  if (
    (context.isAdmin || context.isOwner) &&
    context.organization?.id === note.organizationId
  ) {
    return null
  }

  return forbiddenResponse(
    'You can only delete notes you created or notes in your organization (as admin/owner)'
  )
}
