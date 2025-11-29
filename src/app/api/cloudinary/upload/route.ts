import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      public_id,
      secure_url,
      entityType,
      entityId,
      fieldName,
      oldImageUrl,
    } = body

    if (!public_id || !secure_url) {
      return NextResponse.json(
        { error: 'Missing public_id or secure_url' },
        { status: 400 }
      )
    }

    // Delete old Cloudinary image if provided
    if (oldImageUrl && isCloudinaryUrl(oldImageUrl)) {
      const oldPublicId = extractPublicId(oldImageUrl)
      if (oldPublicId) {
        await deleteCloudinaryImage(oldPublicId)
      }
    }

    // Return the result - let the caller handle database updates
    // This endpoint can be extended to handle database updates if needed
    return NextResponse.json({
      success: true,
      public_id,
      secure_url,
    })
  } catch (error) {
    console.error('Error processing upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

