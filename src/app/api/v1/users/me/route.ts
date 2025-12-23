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

    // Fetch user data
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    })

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 })
    }

    // Fetch linked player and coach data
    const [player, coach] = await Promise.all([
      db.query.players.findFirst({
        where: eq(schema.players.userId, userId),
      }),
      db.query.coaches.findFirst({
        where: eq(schema.coaches.userId, userId),
      }),
    ])

    return Response.json({
      user,
      player: player || null,
      coach: coach || null,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

