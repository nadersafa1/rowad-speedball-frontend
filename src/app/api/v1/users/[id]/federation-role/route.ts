import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { updateUserFederationRoleSchema } from '@/types/api/users.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserFederationRoleUpdateAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = updateUserFederationRoleSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error },
        { status: 400 }
      )
    }

    const { role, federationId } = parseResult.data

    // Check if target user exists
    const targetUser = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization
    const authError = checkUserFederationRoleUpdateAuthorization(
      context,
      userId,
      role,
      federationId
    )
    if (authError) return authError

    // Validate federation exists if provided
    if (federationId) {
      const federation = await db.query.federations.findFirst({
        where: eq(schema.federations.id, federationId),
      })

      if (!federation) {
        return NextResponse.json(
          { error: 'Federation not found' },
          { status: 404 }
        )
      }
    }

    // Update user's federation role and federation ID
    const [updatedUser] = await db
      .update(schema.user)
      .set({
        role,
        federationId,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId))
      .returning()

    return NextResponse.json(updatedUser)
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/v1/users/${userId}/federation-role`,
      method: 'PATCH',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
