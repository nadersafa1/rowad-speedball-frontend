import { NextRequest } from 'next/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  inArray,
  isNull,
  notInArray,
  sql,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { usersQuerySchema } from '@/types/api/users.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserListAuthorization } from '@/lib/authorization'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkUserListAuthorization(context)
  if (authError) return authError

  const { isSystemAdmin: isSystemAdminResult, activeOrgId: activeOrganizationId } = context

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = usersQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, role, sortBy, sortOrder, page, limit, unassigned } =
      parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Filter unassigned users (users with no linked players/coaches AND no organization membership)
    if (unassigned) {
      // Get all user IDs that are linked to players or coaches
      const [linkedToPlayers, linkedToCoaches, organizationMembers] =
        await Promise.all([
          db
            .select({ userId: schema.players.userId })
            .from(schema.players)
            .where(sql`${schema.players.userId} IS NOT NULL`),
          db
            .select({ userId: schema.coaches.userId })
            .from(schema.coaches)
            .where(sql`${schema.coaches.userId} IS NOT NULL`),
          db.select({ userId: schema.member.userId }).from(schema.member),
        ])

      const linkedUserIds = new Set([
        ...linkedToPlayers.map((p) => p.userId).filter(Boolean),
        ...linkedToCoaches.map((c) => c.userId).filter(Boolean),
        ...organizationMembers.map((m) => m.userId).filter(Boolean),
      ])

      if (linkedUserIds.size > 0) {
        conditions.push(
          notInArray(schema.user.id as any, Array.from(linkedUserIds))
        )
      }
    }

    // Text search
    if (q) {
      conditions.push(
        or(
          ilike(schema.user.name, `%${q}%`),
          ilike(schema.user.email, `%${q}%`)
        )
      )
    }

    // Role filter
    if (role) {
      conditions.push(eq(schema.user.role, role))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    // Get users with pagination
    let countQuery = db.select({ count: count() }).from(schema.user)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.user)
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortField = schema.user[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.user.createdAt)) as any
    }

    const [countResult, users] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    // Get organization memberships for all users
    const userIds = users.map((u) => u.id)
    const memberships =
      userIds.length > 0
        ? await db
            .select({
              userId: schema.member.userId,
              organizationId: schema.member.organizationId,
              role: schema.member.role,
              organization: schema.organization,
            })
            .from(schema.member)
            .innerJoin(
              schema.organization,
              eq(schema.member.organizationId, schema.organization.id)
            )
            .where(inArray(schema.member.userId, userIds))
        : []

    // Create a map of userId -> membership
    const membershipMap = new Map(memberships.map((m) => [m.userId, m]))

    // Enrich users with organization info
    const usersWithOrganizations = users.map((user) => {
      const membership = membershipMap.get(user.id)
      return {
        ...user,
        organization: membership
          ? {
              id: membership.organizationId,
              name: membership.organization.name,
              role: membership.role,
            }
          : null,
        isInMyOrganization:
          !isSystemAdminResult &&
          activeOrganizationId &&
          membership?.organizationId === activeOrganizationId,
      }
    })

    const paginatedResponse = createPaginatedResponse(
      usersWithOrganizations,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
