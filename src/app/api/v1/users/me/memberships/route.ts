import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const userId = context.userId!
  const authError = checkUserReadAuthorization(context, userId)
  if (authError) return authError

  try {
    // Get user's memberships with organization details
    const memberships = await db
      .select({
        id: schema.member.id,
        userId: schema.member.userId,
        organizationId: schema.member.organizationId,
        role: schema.member.role,
        createdAt: schema.member.createdAt,
        organization: schema.organization,
      })
      .from(schema.member)
      .innerJoin(
        schema.organization,
        eq(schema.member.organizationId, schema.organization.id)
      )
      .where(eq(schema.member.userId, userId))

    return Response.json(memberships)
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
