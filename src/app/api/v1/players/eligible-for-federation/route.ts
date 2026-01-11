import { NextRequest, NextResponse } from 'next/server'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Check authentication
    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization: must be org owner or admin
    if (!context.organization?.id || (!context.isOwner && !context.isAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden. Only organization owners/admins can access this endpoint' },
        { status: 403 }
      )
    }

    // Get federationId from query params
    const { searchParams } = new URL(request.url)
    const federationId = searchParams.get('federationId')

    if (!federationId) {
      return NextResponse.json(
        { error: 'federationId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate federation exists
    const federation = await db.query.federations.findFirst({
      where: eq(schema.federations.id, federationId),
    })

    if (!federation) {
      return NextResponse.json(
        { error: 'Federation not found' },
        { status: 404 }
      )
    }

    // Get all players from organization
    const orgPlayers = await db.query.players.findMany({
      where: eq(schema.players.organizationId, context.organization.id),
      orderBy: [asc(schema.players.name)],
    })

    // Get existing federation members
    const federationMembers = await db.query.federationPlayers.findMany({
      where: eq(schema.federationPlayers.federationId, federationId),
      columns: { playerId: true },
    })

    const memberPlayerIds = new Set(federationMembers.map((m) => m.playerId))

    // Get pending requests
    const pendingRequests = await db.query.federationPlayerRequests.findMany({
      where: and(
        eq(schema.federationPlayerRequests.federationId, federationId),
        eq(schema.federationPlayerRequests.status, 'pending')
      ),
      columns: { playerId: true },
    })

    const pendingPlayerIds = new Set(pendingRequests.map((r) => r.playerId))

    // Map players with eligibility status
    const playersWithEligibility = orgPlayers.map((player) => ({
      ...player,
      isEligible:
        !memberPlayerIds.has(player.id) && !pendingPlayerIds.has(player.id),
      ineligibilityReason: memberPlayerIds.has(player.id)
        ? 'Already a federation member'
        : pendingPlayerIds.has(player.id)
          ? 'Pending request exists'
          : null,
    }))

    return NextResponse.json({ players: playersWithEligibility })
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/players/eligible-for-federation',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
