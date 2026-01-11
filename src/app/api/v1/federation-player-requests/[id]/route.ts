import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateFederationPlayerRequestStatusSchema } from '@/types/api/federation-player-requests.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

/**
 * PATCH /api/v1/federation-player-requests/[id]
 * Approve or reject a federation player request (federation admin/editor only)
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

    // Only system admins and federation admins/editors can approve/reject requests
    if (
      !context.isSystemAdmin &&
      !context.isFederationAdmin &&
      !context.isFederationEditor
    ) {
      return NextResponse.json(
        {
          error:
            'Only federation admins/editors can approve/reject player requests',
        },
        { status: 403 }
      )
    }

    const requestId = resolvedParams.id

    // Parse request body
    const body = await request.json()
    const parseResult =
      updateFederationPlayerRequestStatusSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { status, rejectionReason, federationRegistrationNumber } =
      parseResult.data

    // Find the request
    const existingRequest = await db.query.federationPlayerRequests.findFirst({
      where: eq(schema.federationPlayerRequests.id, requestId),
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Federation player request not found' },
        { status: 404 }
      )
    }

    // Authorization: Federation admin/editor can only approve/reject requests for their federation
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

    // Validate registration number if status is approved
    if (status === 'approved' && !federationRegistrationNumber) {
      return NextResponse.json(
        {
          error:
            'Federation registration number is required when approving a request',
        },
        { status: 400 }
      )
    }

    // Check for duplicate registration number before starting transaction
    if (status === 'approved') {
      const existingRegistration = await db.query.federationPlayers.findFirst({
        where: and(
          eq(
            schema.federationPlayers.federationId,
            existingRequest.federationId
          ),
          eq(
            schema.federationPlayers.federationRegistrationNumber,
            federationRegistrationNumber!
          )
        ),
      })

      if (existingRegistration) {
        return NextResponse.json(
          {
            error: `Registration number "${federationRegistrationNumber}" is already used for another player in this federation`,
          },
          { status: 400 }
        )
      }
    }

    // Start a transaction
    try {
      await db.transaction(async (tx) => {
        // Update the request status
        await tx
          .update(schema.federationPlayerRequests)
          .set({
            status,
            respondedAt: new Date(),
            respondedBy: context.userId,
            rejectionReason: status === 'rejected' ? rejectionReason : null,
            updatedAt: new Date(),
          })
          .where(eq(schema.federationPlayerRequests.id, requestId))

        // If approved, create federation player membership
        if (status === 'approved') {
          // Check if membership already exists (shouldn't happen, but be safe)
          const existingMembership = await tx.query.federationPlayers.findFirst(
            {
              where: and(
                eq(
                  schema.federationPlayers.federationId,
                  existingRequest.federationId
                ),
                eq(schema.federationPlayers.playerId, existingRequest.playerId)
              ),
            }
          )

          if (existingMembership) {
            throw new Error('Player is already a member of this federation')
          }

          const currentYear = new Date().getFullYear()
          await tx.insert(schema.federationPlayers).values({
            federationId: existingRequest.federationId,
            playerId: existingRequest.playerId,
            federationRegistrationNumber: federationRegistrationNumber!,
            registrationYear: currentYear,
          })
        }
      })
    } catch (error) {
      // Handle transaction errors
      if (error instanceof Error) {
        if (error.message.includes('already a member')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (
          error.message.includes('unique') ||
          error.message.includes('duplicate')
        ) {
          return NextResponse.json(
            { error: 'Registration number is already in use' },
            { status: 400 }
          )
        }
      }
      throw error
    }

    // Fetch and return updated request with relations
    const updatedRequest = await db
      .select({
        id: schema.federationPlayerRequests.id,
        federationId: schema.federationPlayerRequests.federationId,
        playerId: schema.federationPlayerRequests.playerId,
        organizationId: schema.federationPlayerRequests.organizationId,
        status: schema.federationPlayerRequests.status,
        requestedAt: schema.federationPlayerRequests.requestedAt,
        respondedAt: schema.federationPlayerRequests.respondedAt,
        respondedBy: schema.federationPlayerRequests.respondedBy,
        rejectionReason: schema.federationPlayerRequests.rejectionReason,
        createdAt: schema.federationPlayerRequests.createdAt,
        updatedAt: schema.federationPlayerRequests.updatedAt,
        federationName: schema.federations.name,
        playerName: schema.players.name,
        organizationName: schema.organization.name,
        respondedByName: schema.user.name,
      })
      .from(schema.federationPlayerRequests)
      .leftJoin(
        schema.federations,
        eq(schema.federationPlayerRequests.federationId, schema.federations.id)
      )
      .leftJoin(
        schema.players,
        eq(schema.federationPlayerRequests.playerId, schema.players.id)
      )
      .leftJoin(
        schema.organization,
        eq(
          schema.federationPlayerRequests.organizationId,
          schema.organization.id
        )
      )
      .leftJoin(
        schema.user,
        eq(schema.federationPlayerRequests.respondedBy, schema.user.id)
      )
      .where(eq(schema.federationPlayerRequests.id, requestId))
      .limit(1)

    return NextResponse.json(updatedRequest[0])
  } catch (error) {
    console.error('Error updating federation player request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/federation-player-requests/[id]
 * Delete a federation player request (organization owner/admin can delete their own pending requests)
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
    const existingRequest = await db.query.federationPlayerRequests.findFirst({
      where: eq(schema.federationPlayerRequests.id, requestId),
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Federation player request not found' },
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
      .delete(schema.federationPlayerRequests)
      .where(eq(schema.federationPlayerRequests.id, requestId))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting federation player request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
