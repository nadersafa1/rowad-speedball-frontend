import { OrganizationContext } from './organization-helpers'
import type * as schema from '@/db/schema'

/**
 * Check if user has authorization to read player notes
 * Returns Response if unauthorized, null if authorized
 */
export function checkPlayerNotesReadAuthorization(
  context: OrganizationContext,
  player: typeof schema.players.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated } =
    context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // System admins can read all notes
  if (isSystemAdmin) return null

  // Org members can read notes for their org's players
  if ((isAdmin || isOwner || isCoach) && organization?.id === player.organizationId) {
    return null
  }

  return Response.json(
    {
      message: 'You can only view notes for players in your organization',
    },
    { status: 403 }
  )
}

/**
 * Check if user has authorization to create player notes
 * Returns Response if unauthorized, null if authorized
 */
export function checkPlayerNotesCreateAuthorization(
  context: OrganizationContext,
  player: typeof schema.players.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated } =
    context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // System admins can create notes on any player
  if (isSystemAdmin) return null

  // Org members can create notes for their org's players
  if ((isAdmin || isOwner || isCoach) && organization?.id === player.organizationId) {
    return null
  }

  return Response.json(
    {
      message:
        'Only organization admins, owners, and coaches can create notes for players in their organization',
    },
    { status: 403 }
  )
}

/**
 * Check if user has authorization to update a player note
 * Returns Response if unauthorized, null if authorized
 */
export function checkPlayerNoteUpdateAuthorization(
  context: OrganizationContext,
  note: typeof schema.playerNotes.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, userId, isAuthenticated } = context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // System admins can update any note
  if (isSystemAdmin) return null

  // Note creator can update their own note
  if (userId === note.createdBy) return null

  return Response.json(
    {
      message: 'You can only edit notes you created',
    },
    { status: 403 }
  )
}

/**
 * Check if user has authorization to delete a player note
 * Returns Response if unauthorized, null if authorized
 */
export function checkPlayerNoteDeleteAuthorization(
  context: OrganizationContext,
  note: typeof schema.playerNotes.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, isAdmin, isOwner, userId, organization, isAuthenticated } =
    context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // System admins can delete any note
  if (isSystemAdmin) return null

  // Note creator can delete their own note
  if (userId === note.createdBy) return null

  // Org admins/owners can delete notes in their org
  if ((isAdmin || isOwner) && organization?.id === note.organizationId) {
    return null
  }

  return Response.json(
    {
      message: 'You can only delete notes you created or notes in your organization (as admin/owner)',
    },
    { status: 403 }
  )
}
