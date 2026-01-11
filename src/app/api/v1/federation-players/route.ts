import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/organization-helpers'

const federationPlayersQuerySchema = z.object({
  federationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid federation ID format'
    ),
  sortBy: z.enum(['createdAt', 'registrationYear']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
})

/**
 * GET /api/v1/federation-players
 * List federation player memberships with filtering
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
    const parseResult = federationPlayersQuerySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { federationId, sortBy, sortOrder, page, limit } = parseResult.data

    // Build query conditions
    const conditions = []

    if (federationId) {
      conditions.push(eq(schema.federationPlayers.federationId, federationId))
    }

    // Authorization check:
    // - System admins can see all memberships
    // - Federation admins/editors can see their federation's players
    if (!context.isSystemAdmin) {
      if (context.isFederationAdmin || context.isFederationEditor) {
        if (context.federationId) {
          conditions.push(
            eq(schema.federationPlayers.federationId, context.federationId)
          )
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Determine sort column
    const sortColumn = {
      createdAt: schema.federationPlayers.createdAt,
      registrationYear: schema.federationPlayers.registrationYear,
    }[sortBy]

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Calculate offset
    const offset = (page - 1) * limit

    // Execute query with joins to get related data
    const players = await db
      .select({
        id: schema.federationPlayers.id,
        federationId: schema.federationPlayers.federationId,
        playerId: schema.federationPlayers.playerId,
        federationRegistrationNumber:
          schema.federationPlayers.federationRegistrationNumber,
        registrationYear: schema.federationPlayers.registrationYear,
        createdAt: schema.federationPlayers.createdAt,
        playerName: schema.players.name,
        organizationId: schema.players.organizationId,
        organizationName: schema.organization.name,
      })
      .from(schema.federationPlayers)
      .leftJoin(
        schema.players,
        eq(schema.federationPlayers.playerId, schema.players.id)
      )
      .leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)

    // Count total items
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.federationPlayers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalItems = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: players,
      page,
      limit,
      totalItems,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching federation players:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
