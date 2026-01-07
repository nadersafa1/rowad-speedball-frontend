import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { z } from 'zod'

const federationClubsQuerySchema = z.object({
  federationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid federation ID format'
    ),
  organizationId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || z.uuid().safeParse(val).success,
      'Invalid organization ID format'
    ),
  sortBy: z.enum(['createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
})

/**
 * GET /api/v1/federation-clubs
 * List federation club memberships with filtering
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
    const parseResult = federationClubsQuerySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { federationId, organizationId, sortBy, sortOrder, page, limit } =
      parseResult.data

    // Build query conditions
    const conditions = []

    if (federationId) {
      conditions.push(eq(schema.federationClubs.federationId, federationId))
    }

    if (organizationId) {
      conditions.push(eq(schema.federationClubs.organizationId, organizationId))
    }

    // Authorization check:
    // - System admins can see all memberships
    // - Federation admins/editors can see their federation's clubs
    // - Organization owners/admins can see their organization's federation memberships
    if (!context.isSystemAdmin) {
      const userConditions = []

      if (context.isFederationAdmin || context.isFederationEditor) {
        if (context.federationId) {
          userConditions.push(
            eq(schema.federationClubs.federationId, context.federationId)
          )
        }
      }

      if (context.organization?.id) {
        userConditions.push(
          eq(schema.federationClubs.organizationId, context.organization?.id)
        )
      }

      if (userConditions.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Add OR condition for user-specific access
      conditions.push(sql`(${sql.join(userConditions, sql` OR `)})`)
    }

    // Determine sort column
    const sortColumn = schema.federationClubs.createdAt

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Calculate offset
    const offset = (page - 1) * limit

    // Execute query with joins to get related data
    const clubs = await db
      .select({
        id: schema.federationClubs.id,
        federationId: schema.federationClubs.federationId,
        organizationId: schema.federationClubs.organizationId,
        createdAt: schema.federationClubs.createdAt,
        federationName: schema.federations.name,
        organizationName: schema.organization.name,
      })
      .from(schema.federationClubs)
      .leftJoin(
        schema.federations,
        eq(schema.federationClubs.federationId, schema.federations.id)
      )
      .leftJoin(
        schema.organization,
        eq(schema.federationClubs.organizationId, schema.organization.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)

    // Count total items
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.federationClubs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalItems = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: clubs,
      page,
      limit,
      totalItems,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching federation clubs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
