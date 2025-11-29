import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'
import {
  isCloudinaryUrl,
  extractPublicId,
  deleteCloudinaryImage,
} from '@/lib/cloudinary-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { public_id, secure_url } = body

    if (!public_id || !secure_url) {
      return NextResponse.json(
        { error: 'Missing public_id or secure_url' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Get current user to check for old image
    const currentUser = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete old Cloudinary image if it exists and is from Cloudinary
    if (currentUser.image && isCloudinaryUrl(currentUser.image)) {
      const oldPublicId = extractPublicId(currentUser.image)
      if (oldPublicId) {
        await deleteCloudinaryImage(oldPublicId)
      }
    }

    // Update user image in database
    const [updatedUser] = await db
      .update(schema.user)
      .set({
        image: secure_url,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId))
      .returning()

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

