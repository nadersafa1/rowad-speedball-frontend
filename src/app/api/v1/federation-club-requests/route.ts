import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import {
  federationClubRequestsQuerySchema,
  createFederationClubRequestSchema,
} from '@/types/api/federation-club-requests.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

/**
 * GET /api/v1/federation-club-requests
 * List federation club requests with filtering
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
    const parseResult = federationClubRequestsQuerySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const {
      federationId,
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
      conditions.push(eq(schema.federationClubRequests.federationId, federationId))
    }

    if (organizationId) {
      conditions.push(eq(schema.federationClubRequests.organizationId, organizationId))
    }

    if (status && status !== 'all') {
      conditions.push(eq(schema.federationClubRequests.status, status))
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
            eq(schema.federationClubRequests.federationId, context.federationId)
          )
        }
      }

      if (context.organization?.id) {
        userConditions.push(
          eq(schema.federationClubRequests.organizationId, context.organization?.id)
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
      requestedAt: schema.federationClubRequests.requestedAt,
      respondedAt: schema.federationClubRequests.respondedAt,
      createdAt: schema.federationClubRequests.createdAt,
      updatedAt: schema.federationClubRequests.updatedAt,
    }[sortBy || 'requestedAt']

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Calculate offset
    const offset = (page - 1) * limit

    // Execute query with joins to get related data
    const requests = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)

    // Count total items
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.federationClubRequests)
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
    console.error('Error fetching federation club requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/federation-club-requests
 * Create a new federation club request (club admin requesting to join federation)
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
        { error: 'Only organization owners/admins can request to join a federation' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const parseResult = createFederationClubRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { federationId } = parseResult.data

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

    // Check if organization is already a member
    const existingMembership = await db.query.federationClubs.findFirst({
      where: and(
        eq(schema.federationClubs.federationId, federationId),
        eq(schema.federationClubs.organizationId, context.organization?.id)
      ),
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Organization is already a member of this federation' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const existingRequest = await db.query.federationClubRequests.findFirst({
      where: and(
        eq(schema.federationClubRequests.federationId, federationId),
        eq(schema.federationClubRequests.organizationId, context.organization?.id),
        eq(schema.federationClubRequests.status, 'pending')
      ),
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending request already exists for this federation' },
        { status: 400 }
      )
    }

    // Create the request
    const [newRequest] = await db
      .insert(schema.federationClubRequests)
      .values({
        federationId,
        organizationId: context.organization?.id,
        status: 'pending',
        requestedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating federation club request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
