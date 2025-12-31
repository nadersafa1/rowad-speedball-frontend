import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  organizationsCreateSchema,
  organizationsQuerySchema,
} from '@/types/api/organizations.schemas'
import {
  getOrganizationContext,
  getAllAppAdmins,
} from '@/lib/organization-helpers'
import { checkOrganizationCreateAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'
import { createPaginatedResponse } from '@/types/api/pagination'

export async function GET(request: NextRequest) {
  // Organizations list is public - anyone can see available clubs for filtering
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = organizationsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, sortBy, sortOrder, page, limit } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Text search filter
    if (q) {
      conditions.push(
        or(
          ilike(schema.organization.name, `%${q}%`),
          ilike(schema.organization.slug, `%${q}%`)
        )
      )
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    // Count query
    let countQuery = db.select({ count: count() }).from(schema.organization)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    // Data query
    let dataQuery = db
      .select({
        id: schema.organization.id,
        name: schema.organization.name,
        slug: schema.organization.slug,
        createdAt: schema.organization.createdAt,
      })
      .from(schema.organization)

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        name: schema.organization.name,
        slug: schema.organization.slug,
        createdAt: schema.organization.createdAt,
      }

      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else {
      // Default sort by name ascending
      dataQuery = dataQuery.orderBy(asc(schema.organization.name)) as any
    }

    const [countResult, organizations] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    const paginatedResponse = createPaginatedResponse(
      organizations,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/organizations',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkOrganizationCreateAuthorization(context)
  if (authError) return authError

  try {
    const body = await request.json()
    const parseResult = organizationsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, slug, members } = parseResult.data

    // Check if organization with slug already exists
    const existingOrg = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, slug),
    })

    if (existingOrg) {
      return Response.json(
        { message: 'Organization with this slug already exists' },
        { status: 400 }
      )
    }

    // Validate all user IDs exist and aren't already in another organization
    if (members && members.length > 0) {
      const userIds = members.map((m) => m.userId)

      // Check all users exist
      const users = await db
        .select()
        .from(schema.user)
        .where(inArray(schema.user.id, userIds))

      if (users.length !== userIds.length) {
        return Response.json(
          { message: 'One or more users not found' },
          { status: 400 }
        )
      }

      // Check if any user is already in an organization
      const existingMemberships = await db
        .select()
        .from(schema.member)
        .where(inArray(schema.member.userId, userIds))

      if (existingMemberships.length > 0) {
        return Response.json(
          { message: 'One or more users are already in an organization' },
          { status: 400 }
        )
      }
    }

    // Create organization directly in database
    // Use defaultRandom() from schema which uses uuid
    const [newOrganization] = await db
      .insert(schema.organization)
      .values({
        name,
        slug,
        createdAt: new Date(),
      })
      .returning()

    const organizationId = newOrganization.id

    // Add members if provided
    const addedMemberIds = new Set<string>()
    if (members && members.length > 0) {
      const memberValues = members.map((member) => {
        addedMemberIds.add(member.userId)
        return {
          organizationId,
          userId: member.userId,
          role: member.role,
          createdAt: new Date(),
        }
      })

      await db.insert(schema.member).values(memberValues)
    }

    // Automatically add all app admins as organization admins
    // This ensures app admins can see all organizations via useListOrganizations
    try {
      const appAdminIds = await getAllAppAdmins()
      const adminsToAdd = appAdminIds.filter(
        (adminId) => !addedMemberIds.has(adminId)
      )

      if (adminsToAdd.length > 0) {
        const adminMemberValues = adminsToAdd.map((adminId) => ({
          organizationId,
          userId: adminId,
          role: 'admin' as const,
          createdAt: new Date(),
        }))

        await db.insert(schema.member).values(adminMemberValues)
      }
    } catch (error) {
      // Log error but don't fail organization creation
      console.error('Error adding app admins to organization:', error)
    }

    // Fetch the organization with members
    const orgMembers = await db
      .select({
        id: schema.member.id,
        userId: schema.member.userId,
        role: schema.member.role,
        createdAt: schema.member.createdAt,
        user: {
          id: schema.user.id,
          name: schema.user.name,
          email: schema.user.email,
        },
      })
      .from(schema.member)
      .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
      .where(eq(schema.member.organizationId, organizationId))

    return Response.json(
      {
        ...newOrganization,
        members: orgMembers,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/organizations',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
