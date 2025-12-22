import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'
import {
  isCloudinaryUrl,
  extractPublicId,
  deleteCloudinaryImage,
} from '@/lib/cloudinary-utils'

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const userId = context.userId!
  const authError = checkUserReadAuthorization(context, userId)
  if (authError) return authError

  try {
    const body = await request.json()
    const { public_id, secure_url } = body

    if (!public_id || !secure_url) {
      return NextResponse.json(
        { error: 'Missing public_id or secure_url' },
        { status: 400 }
      )
    }

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

