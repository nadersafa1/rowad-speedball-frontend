import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'

const addMemberSchema = z.object({
  userId: z.uuid('Invalid user ID format'),
  role: z.enum(['owner', 'admin', 'coach', 'member', 'player']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  // Check authentication
  if (!context.isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const organizationId = resolvedParams.id

  // Check if user is system admin, org admin/owner, or org coach
  const {
    isSystemAdmin: isSystemAdminResult,
    activeOrgId: activeOrganizationId,
    isAdmin,
    isOwner,
    isCoach: isOrgCoach,
  } = context
  const isOrgAdmin = isAdmin || isOwner

  // System admin can add to any org, org admin/owner/coach can only add to their org
  if (!isSystemAdminResult) {
    if (!activeOrganizationId || activeOrganizationId !== organizationId) {
      return Response.json(
        { message: 'You can only add users to your own organization' },
        { status: 403 }
      )
    }

    if (!isOrgAdmin && !isOrgCoach) {
      return Response.json(
        { message: 'Only admins, owners, and coaches can add users' },
        { status: 403 }
      )
    }
  }

  try {
    const body = await request.json()
    const parseResult = addMemberSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { userId, role } = parseResult.data

    // Check if organization exists
    const organization = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organizationId),
    })

    if (!organization) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    })

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if user is already in this organization
    const existingMember = await db.query.member.findFirst({
      where: eq(schema.member.userId, userId),
    })

    if (existingMember) {
      if (existingMember.organizationId === organizationId) {
        return Response.json(
          { message: 'User is already a member of this organization' },
          { status: 400 }
        )
      } else {
        return Response.json(
          { message: 'User is already a member of another organization' },
          { status: 400 }
        )
      }
    }

    // Add member
    // Note: Welcome email will be sent automatically via database hook in auth.ts
    await db.insert(schema.member).values({
      organizationId,
      userId,
      role,
      createdAt: new Date(),
    })

    return Response.json(
      { message: 'Member added successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding member:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
