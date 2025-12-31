import { NextRequest } from 'next/server'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const userId = context.userId!
  const authError = checkUserReadAuthorization(context, userId)
  if (authError) return authError

  try {
    return Response.json(context)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/users/me/organization-context',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

