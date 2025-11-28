import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { setupInitialOrganization } from '@/scripts/setup-initial-organization'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const hasPermission = await auth.api.userHasPermission({
    headers: await headers(),
    body: { permission: { user: ['list'] } },
  })

  if (!hasPermission.success) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const organization = await setupInitialOrganization()
    return Response.json(
      { message: 'Organization setup complete', organization },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error setting up organization:', error)
    return Response.json(
      { message: 'Failed to setup organization', error: String(error) },
      { status: 500 }
    )
  }
}

