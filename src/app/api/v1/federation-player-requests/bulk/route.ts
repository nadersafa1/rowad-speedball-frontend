import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { bulkCreateFederationPlayerRequestSchema } from '@/types/api/federation-player-requests.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkFederationPlayerRequestCreateAuthorization } from '@/lib/authorization/helpers/federation-player-request-authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function POST(request: NextRequest) {
  try {
    // 1. Get context and check authorization
    const context = await getOrganizationContext()
    const authError = checkFederationPlayerRequestCreateAuthorization(context)
    if (authError) return authError

    // 2. Parse and validate body
    const body = await request.json()
    const parseResult = bulkCreateFederationPlayerRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { federationId, playerIds } = parseResult.data

    // 3. Validate federation exists
    const federation = await db.query.federations.findFirst({
      where: eq(schema.federations.id, federationId),
    })

    if (!federation) {
      return NextResponse.json(
        { error: 'Federation not found' },
        { status: 404 }
      )
    }

    // 4. Use transaction for all-or-nothing creation
    const result = await db.transaction(async (tx) => {
      const errors: Array<{ playerId: string; error: string }> = []

      // Validate all players first
      for (const playerId of playerIds) {
        // Check player exists and belongs to org
        const player = await tx.query.players.findFirst({
          where: eq(schema.players.id, playerId),
        })

        if (!player) {
          errors.push({ playerId, error: 'Player not found' })
          continue
        }

        if (player.organizationId !== context.organization?.id) {
          errors.push({
            playerId,
            error: 'Player does not belong to your organization',
          })
          continue
        }

        // Check not already a member
        const existingMembership = await tx.query.federationPlayers.findFirst({
          where: and(
            eq(schema.federationPlayers.federationId, federationId),
            eq(schema.federationPlayers.playerId, playerId)
          ),
        })

        if (existingMembership) {
          errors.push({
            playerId,
            error: 'Player is already a federation member',
          })
          continue
        }

        // Check no pending request
        const existingRequest = await tx.query.federationPlayerRequests.findFirst(
          {
            where: and(
              eq(schema.federationPlayerRequests.federationId, federationId),
              eq(schema.federationPlayerRequests.playerId, playerId),
              eq(schema.federationPlayerRequests.status, 'pending')
            ),
          }
        )

        if (existingRequest) {
          errors.push({
            playerId,
            error: 'Pending request already exists for this player',
          })
          continue
        }
      }

      // If any errors, rollback transaction
      if (errors.length > 0) {
        throw new Error(JSON.stringify({ validationErrors: errors }))
      }

      // Create all requests
      const createdRequests = []
      for (const playerId of playerIds) {
        const [newRequest] = await tx
          .insert(schema.federationPlayerRequests)
          .values({
            federationId,
            playerId,
            organizationId: context.organization?.id!,
            status: 'pending',
            requestedAt: new Date(),
          })
          .returning()

        createdRequests.push(newRequest)
      }

      return createdRequests
    })

    return NextResponse.json(
      {
        success: true,
        count: result.length,
        requests: result,
      },
      { status: 201 }
    )
  } catch (error) {
    // Check if this is a validation error from transaction
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message)
        if (parsed.validationErrors) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              validationErrors: parsed.validationErrors,
            },
            { status: 400 }
          )
        }
      } catch {
        // Not a JSON error, continue to default handler
      }
    }

    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/federation-player-requests/bulk',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
