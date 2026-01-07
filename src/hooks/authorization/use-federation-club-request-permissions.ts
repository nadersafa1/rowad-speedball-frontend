'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { FederationClubRequest } from '@/db/schema'

/**
 * Hook to check federation club request-based permissions
 * Returns permission flags based on user role and request ownership
 */
export const useFederationClubRequestPermissions = (
  request?: FederationClubRequest | null
) => {
  const { context } = useOrganizationContext()
  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    isOwner,
    isAdmin,
    federationId,
    organization,
    isAuthenticated,
  } = context

  const organizationId = organization?.id

  return useMemo(() => {
    // Create permission: Organization owners/admins with an organizationId
    const canCreate = isAuthenticated && !!organizationId && (isOwner || isAdmin)

    if (!request) {
      return {
        canRead: isAuthenticated,
        canCreate,
        canUpdate: false,
        canDelete: false,
        canApprove: false,
        canReject: false,
      }
    }

    // Read permission: Must be authenticated and either:
    // - System admin
    // - Federation admin/editor for the request's federation
    // - Organization owner/admin for the request's organization
    const canRead =
      isAuthenticated &&
      (isSystemAdmin ||
        (isFederationAdmin || isFederationEditor) &&
          federationId === request.federationId ||
        ((isOwner || isAdmin) && organizationId === request.organizationId))

    // Update (approve/reject) permission: System admins OR federation admins for this federation
    const canUpdate =
      isSystemAdmin ||
      (isFederationAdmin && federationId === request.federationId)

    const canApprove = canUpdate && request.status === 'pending'
    const canReject = canUpdate && request.status === 'pending'

    // Delete permission:
    // - System admins can delete any request
    // - Federation admins can delete requests for their federation
    // - Organization owners/admins can delete their own pending requests
    const canDelete =
      isSystemAdmin ||
      (isFederationAdmin && federationId === request.federationId) ||
      ((isOwner || isAdmin) &&
        organizationId === request.organizationId &&
        request.status === 'pending')

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      canApprove,
      canReject,
    }
  }, [
    request,
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    isOwner,
    isAdmin,
    federationId,
    organizationId,
    isAuthenticated,
  ])
}
