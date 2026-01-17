import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { handleApiError } from '@/lib/api-error-handler'

const organizationsParamsSchema = z.object({
  id: z.uuid(),
})

const organizationsUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const parseResult = organizationsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if organization exists
    const organization = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, id))
      .limit(1)

    if (organization.length === 0) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Authorization check - only system admins can view organization details
    const context = await getOrganizationContext()
    if (!context.isSystemAdmin) {
      return Response.json(
        { message: 'Only system administrators can view organization details' },
        { status: 403 }
      )
    }

    return Response.json(organization[0])
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/organizations/[id]',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const parseResult = organizationsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Parse request body
    const body = await request.json()
    const updateResult = organizationsUpdateSchema.safeParse(body)

    if (!updateResult.success) {
      return Response.json(z.treeifyError(updateResult.error), { status: 400 })
    }

    const updateData = updateResult.data

    // Check if organization exists
    const existing = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Authorization check - only system admins can update organizations
    const context = await getOrganizationContext()
    if (!context.isSystemAdmin) {
      return Response.json(
        { message: 'Only system administrators can update organizations' },
        { status: 403 }
      )
    }

    // Check if slug is already taken (if slug is being updated)
    if (updateData.slug && updateData.slug !== existing[0].slug) {
      const slugExists = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.slug, updateData.slug))
        .limit(1)

      if (slugExists.length > 0) {
        return Response.json(
          { message: 'Slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Update organization
    const [updated] = await db
      .update(schema.organization)
      .set(updateData)
      .where(eq(schema.organization.id, id))
      .returning()

    return Response.json(updated, { status: 200 })
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/organizations/[id]',
      method: 'PATCH',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const parseResult = organizationsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if organization exists
    const existing = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Authorization check - only system admins can delete organizations
    const context = await getOrganizationContext()
    if (!context.isSystemAdmin) {
      return Response.json(
        { message: 'Only system administrators can delete organizations' },
        { status: 403 }
      )
    }

    // Delete organization (cascade will handle members)
    await db.delete(schema.organization).where(eq(schema.organization.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/organizations/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
