import { NextRequest } from 'next/server'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  // Check authentication
  if (!context.isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    return Response.json(context)
  } catch (error) {
    console.error('Error fetching organization context:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

