import { NextRequest } from 'next/server'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const userId = context.userId!
  const authError = checkUserReadAuthorization(context, userId)
  if (authError) return authError

  try {
    return Response.json(context)
  } catch (error) {
    console.error('Error fetching organization context:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

