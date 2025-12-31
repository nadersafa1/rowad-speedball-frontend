import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkOrganizationMemberManagementAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

const addMemberSchema = z.object({
  userId: z.uuid('Invalid user ID format'),
  role: z.enum(['owner', 'admin', 'coach', 'member', 'player']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const organizationId = resolvedParams.id

  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkOrganizationMemberManagementAuthorization(
    context,
    organizationId
  )
  if (authError) return authError

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
    return handleApiError(error, {
      endpoint: '/api/v1/organizations/[id]/members',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
