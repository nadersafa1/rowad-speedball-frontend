import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateFederationClubRequestStatusSchema } from '@/types/api/federation-club-requests.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

/**
 * PATCH /api/v1/federation-club-requests/[id]
 * Approve or reject a federation club request (federation admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only system admins and federation admins can approve/reject requests
    if (!context.isSystemAdmin && !context.isFederationAdmin) {
      return NextResponse.json(
        { error: 'Only federation admins can approve/reject club requests' },
        { status: 403 }
      )
    }

    const requestId = resolvedParams.id

    // Parse request body
    const body = await request.json()
    const parseResult = updateFederationClubRequestStatusSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { status, rejectionReason } = parseResult.data

    // Find the request
    const existingRequest = await db.query.federationClubRequests.findFirst({
      where: eq(schema.federationClubRequests.id, requestId),
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Federation club request not found' },
        { status: 404 }
      )
    }

    // Authorization: Federation admin can only approve/reject requests for their federation
    if (
      !context.isSystemAdmin &&
      existingRequest.federationId !== context.federationId
    ) {
      return NextResponse.json(
        { error: 'You can only process requests for your federation' },
        { status: 403 }
      )
    }

    // Check if request is already processed
    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${existingRequest.status}` },
        { status: 400 }
      )
    }

    // Validate rejection reason if status is rejected
    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a request' },
        { status: 400 }
      )
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Update the request status
      await tx
        .update(schema.federationClubRequests)
        .set({
          status,
          respondedAt: new Date(),
          respondedBy: context.userId,
          rejectionReason: status === 'rejected' ? rejectionReason : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.federationClubRequests.id, requestId))

      // If approved, create federation club membership
      if (status === 'approved') {
        // Check if membership already exists (shouldn't happen, but be safe)
        const existingMembership = await tx.query.federationClubs.findFirst({
          where: and(
            eq(schema.federationClubs.federationId, existingRequest.federationId),
            eq(schema.federationClubs.organizationId, existingRequest.organizationId)
          ),
        })

        if (!existingMembership) {
          await tx.insert(schema.federationClubs).values({
            federationId: existingRequest.federationId,
            organizationId: existingRequest.organizationId,
          })
        }
      }
    })

    // Fetch and return updated request with relations
    const updatedRequest = await db
      .select({
        id: schema.federationClubRequests.id,
        federationId: schema.federationClubRequests.federationId,
        organizationId: schema.federationClubRequests.organizationId,
        status: schema.federationClubRequests.status,
        requestedAt: schema.federationClubRequests.requestedAt,
        respondedAt: schema.federationClubRequests.respondedAt,
        respondedBy: schema.federationClubRequests.respondedBy,
        rejectionReason: schema.federationClubRequests.rejectionReason,
        createdAt: schema.federationClubRequests.createdAt,
        updatedAt: schema.federationClubRequests.updatedAt,
        federationName: schema.federations.name,
        organizationName: schema.organization.name,
        respondedByName: schema.user.name,
      })
      .from(schema.federationClubRequests)
      .leftJoin(
        schema.federations,
        eq(schema.federationClubRequests.federationId, schema.federations.id)
      )
      .leftJoin(
        schema.organization,
        eq(schema.federationClubRequests.organizationId, schema.organization.id)
      )
      .leftJoin(
        schema.user,
        eq(schema.federationClubRequests.respondedBy, schema.user.id)
      )
      .where(eq(schema.federationClubRequests.id, requestId))
      .limit(1)

    return NextResponse.json(updatedRequest[0])
  } catch (error) {
    console.error('Error updating federation club request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/federation-club-requests/[id]
 * Delete a federation club request (organization owner/admin can delete their own pending requests)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = resolvedParams.id

    // Find the request
    const existingRequest = await db.query.federationClubRequests.findFirst({
      where: eq(schema.federationClubRequests.id, requestId),
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Federation club request not found' },
        { status: 404 }
      )
    }

    // Authorization:
    // - System admins can delete any request
    // - Federation admins can delete requests for their federation
    // - Organization owners/admins can delete their own pending requests
    const canDelete =
      context.isSystemAdmin ||
      (context.isFederationAdmin &&
        existingRequest.federationId === context.federationId) ||
      ((context.isOwner || context.isAdmin) &&
        existingRequest.organizationId === context.organization?.id &&
        existingRequest.status === 'pending')

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this request' },
        { status: 403 }
      )
    }

    // Delete the request
    await db
      .delete(schema.federationClubRequests)
      .where(eq(schema.federationClubRequests.id, requestId))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting federation club request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
