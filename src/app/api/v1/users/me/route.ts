import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

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

