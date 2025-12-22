import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'

const userParamsSchema = z.object({
  id: z.uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = userParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Authorization check
    const context = await getOrganizationContext()
    const authError = checkUserReadAuthorization(context, id)
    if (authError) return authError

    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, id),
    })

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 })
    }

    // Return user data including image
    return Response.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
