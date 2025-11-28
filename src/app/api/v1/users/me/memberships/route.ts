import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  // Check authentication
  if (!context.isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

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
      .where(eq(schema.member.userId, session.user.id))

    return Response.json(memberships)
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
