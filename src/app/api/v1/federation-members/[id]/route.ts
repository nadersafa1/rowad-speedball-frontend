import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { federationMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  updateFederationMemberSchema,
  type UpdateFederationMemberInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/federation-members/[id] - Get member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins, editors, and system admins can view members
    if (
      !context.isFederationAdmin &&
      !context.isFederationEditor &&
      !context.isSystemAdmin
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const member = await db.query.federationMembers.findFirst({
      where: eq(federationMembers.id, id),
      with: {
        player: true,
        firstRegistrationSeason: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check federation access for federation admins/editors
    if (
      (context.isFederationAdmin || context.isFederationEditor) &&
      context.federationId &&
      member.federationId !== context.federationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/federation-members/[id] - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins and system admins can update members
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing member
    const existingMember = await db.query.federationMembers.findFirst({
      where: eq(federationMembers.id, id),
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check federation access for federation admins
    if (
      context.isFederationAdmin &&
      context.federationId &&
      existingMember.federationId !== context.federationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as UpdateFederationMemberInput
    const validatedData = updateFederationMemberSchema.parse(body)

    // Update member
    const [updatedMember] = await db
      .update(federationMembers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(federationMembers.id, id))
      .returning()

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    // Handle unique constraint violations
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Federation ID number already exists for this federation' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/federation-members/[id] - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only system admins can delete members (federation admins can only suspend/revoke)
    if (!context.isSystemAdmin) {
      return NextResponse.json(
        {
          error:
            'Only system administrators can delete federation members. Use status update to suspend/revoke instead.',
        },
        { status: 403 }
      )
    }

    // Fetch existing member
    const existingMember = await db.query.federationMembers.findFirst({
      where: eq(federationMembers.id, id),
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Delete member
    await db.delete(federationMembers).where(eq(federationMembers.id, id))

    return NextResponse.json(
      { message: 'Member deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting member:', error)

    // Handle foreign key constraint violations
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23503'
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete member with active season registrations. Revoke membership status instead.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
