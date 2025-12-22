'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { PlayerNote } from '@/db/schema'

export const usePlayerNotePermissions = (
  note: (PlayerNote & { organizationId?: string | null }) | null | undefined,
  playerOrganizationId?: string | null
) => {
  const { context } = useOrganizationContext()
  const {
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    userId,
    organization,
    isAuthenticated,
  } = context

  return useMemo(() => {
    // For create permission, we need the player's organization ID
    // For update/delete, we need the note's organization ID
    const relevantOrgId = note?.organizationId || playerOrganizationId

    const isNoteFromUserOrg =
      !!organization?.id && relevantOrgId === organization.id
    const hasCoachPermissions = isAdmin || isOwner || isCoach

    // Read: Authenticated AND (system admin OR org member with coach permissions)
    const canRead =
      isAuthenticated &&
      (isSystemAdmin || (hasCoachPermissions && isNoteFromUserOrg))

    // Create: Authenticated AND (system admin OR org member with coach permissions)
    const canCreate =
      isAuthenticated &&
      (isSystemAdmin || (hasCoachPermissions && isNoteFromUserOrg))

    // Update: Authenticated AND (system admin OR note creator)
    const canUpdate =
      isAuthenticated && (isSystemAdmin || (note && userId === note.createdBy))

    // Delete: Authenticated AND (system admin OR note creator OR org admin/owner)
    const canDelete =
      isAuthenticated &&
      (isSystemAdmin ||
        (note && userId === note.createdBy) ||
        ((isAdmin || isOwner) && isNoteFromUserOrg))

    return { canRead, canCreate, canUpdate, canDelete }
  }, [
    note,
    playerOrganizationId,
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    userId,
    organization,
    isAuthenticated,
  ])
}
