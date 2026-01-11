import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import {
  federationPlayerRequestsQuerySchema,
  createFederationPlayerRequestSchema,
} from '@/types/api/federation-player-requests.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

/**
 * GET /api/v1/federation-player-requests
 * List federation player requests with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const parseResult = federationPlayerRequestsQuerySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const {
      federationId,
      playerId,
      organizationId,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data

    // Build query conditions
    const conditions = []

    if (federationId) {
      conditions.push(eq(schema.federationPlayerRequests.federationId, federationId))
    }

    if (playerId) {
      conditions.push(eq(schema.federationPlayerRequests.playerId, playerId))
    }

    if (organizationId) {
      conditions.push(eq(schema.federationPlayerRequests.organizationId, organizationId))
    }

    if (status && status !== 'all') {
      conditions.push(eq(schema.federationPlayerRequests.status, status))
    }

    // Authorization check:
    // - System admins can see all requests
    // - Federation admins/editors can see requests for their federation
    // - Organization owners/admins can see requests from their organization
    if (!context.isSystemAdmin) {
      const userConditions = []

      if (context.isFederationAdmin || context.isFederationEditor) {
        if (context.federationId) {
          userConditions.push(
            eq(schema.federationPlayerRequests.federationId, context.federationId)
          )
        }
      }

      if (context.organization?.id) {
        userConditions.push(
          eq(schema.federationPlayerRequests.organizationId, context.organization?.id)
        )
      }

      if (userConditions.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Add OR condition for user-specific access
      conditions.push(sql`(${sql.join(userConditions, sql` OR `)})`)
    }

    // Determine sort column
    const sortColumn = {
      requestedAt: schema.federationPlayerRequests.requestedAt,
      respondedAt: schema.federationPlayerRequests.respondedAt,
      createdAt: schema.federationPlayerRequests.createdAt,
      updatedAt: schema.federationPlayerRequests.updatedAt,
    }[sortBy || 'requestedAt']

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Calculate offset
    const offset = (page - 1) * limit

    // Execute query with joins to get related data
    const requests = await db
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
        eq(schema.federationPlayerRequests.organizationId, schema.organization.id)
      )
      .leftJoin(
        schema.user,
        eq(schema.federationPlayerRequests.respondedBy, schema.user.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)

    // Count total items
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.federationPlayerRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalItems = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: requests,
      page,
      limit,
      totalItems,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching federation player requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/federation-player-requests
 * Create a new federation player request (club admin requesting player to join federation)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only organization owners/admins can create requests
    if (!context.organization?.id || (!context.isOwner && !context.isAdmin)) {
      return NextResponse.json(
        { error: 'Only organization owners/admins can request player federation membership' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const parseResult = createFederationPlayerRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { federationId, playerId } = parseResult.data

    // Check if federation exists
    const federation = await db.query.federations.findFirst({
      where: eq(schema.federations.id, federationId),
    })

    if (!federation) {
      return NextResponse.json(
        { error: 'Federation not found' },
        { status: 404 }
      )
    }

    // Check if player exists and belongs to the organization
    const player = await db.query.players.findFirst({
      where: eq(schema.players.id, playerId),
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    if (player.organizationId !== context.organization?.id) {
      return NextResponse.json(
        { error: 'Player does not belong to your organization' },
        { status: 403 }
      )
    }

    // Check if player is already a federation member
    const existingMembership = await db.query.federationPlayers.findFirst({
      where: and(
        eq(schema.federationPlayers.federationId, federationId),
        eq(schema.federationPlayers.playerId, playerId)
      ),
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Player is already a member of this federation' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const existingRequest = await db.query.federationPlayerRequests.findFirst({
      where: and(
        eq(schema.federationPlayerRequests.federationId, federationId),
        eq(schema.federationPlayerRequests.playerId, playerId),
        eq(schema.federationPlayerRequests.status, 'pending')
      ),
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending request already exists for this player and federation' },
        { status: 400 }
      )
    }

    // Create the request
    const [newRequest] = await db
      .insert(schema.federationPlayerRequests)
      .values({
        federationId,
        playerId,
        organizationId: context.organization?.id,
        status: 'pending',
        requestedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating federation player request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
