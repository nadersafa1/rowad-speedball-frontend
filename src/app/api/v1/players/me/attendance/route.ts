/**
 * Player Attendance API
 * GET /api/v1/players/me/attendance - Get current player's attendance records
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trainingSessionAttendance, trainingSessions, players } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { getOrganizationContext } from '@/lib/organization-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = await getOrganizationContext()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const sessionType = searchParams.get('sessionType')

    // Get the player associated with this user
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.userId, context.userId))
      .limit(1)

    if (!player) {
      return NextResponse.json(
        { error: 'No player profile found for this user' },
        { status: 404 }
      )
    }

    // Build query conditions
    const conditions = [eq(trainingSessionAttendance.playerId, player.id)]

    if (startDate) {
      conditions.push(
        gte(sql`DATE(${trainingSessions.date})`, sql`DATE(${startDate})`)
      )
    }

    if (endDate) {
      conditions.push(
        lte(sql`DATE(${trainingSessions.date})`, sql`DATE(${endDate})`)
      )
    }

    if (status && status !== 'all') {
      conditions.push(
        eq(
          trainingSessionAttendance.status,
          status as
            | 'pending'
            | 'present'
            | 'late'
            | 'absent_excused'
            | 'absent_unexcused'
            | 'suspended'
        )
      )
    }

    if (sessionType && sessionType !== 'all') {
      conditions.push(
        sql`${sessionType} = ANY(${trainingSessions.type})`
      )
    }

    // Fetch attendance records with session details
    const attendanceRecords = await db
      .select({
        id: trainingSessionAttendance.id,
        status: trainingSessionAttendance.status,
        playerId: trainingSessionAttendance.playerId,
        trainingSessionId: trainingSessionAttendance.trainingSessionId,
        session: {
          id: trainingSessions.id,
          name: trainingSessions.name,
          description: trainingSessions.description,
          date: trainingSessions.date,
          type: trainingSessions.type,
          intensity: trainingSessions.intensity,
          ageGroups: trainingSessions.ageGroups,
          createdAt: trainingSessions.createdAt,
        },
      })
      .from(trainingSessionAttendance)
      .innerJoin(
        trainingSessions,
        eq(trainingSessionAttendance.trainingSessionId, trainingSessions.id)
      )
      .where(and(...conditions))
      .orderBy(sql`${trainingSessions.date} DESC`)

    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length,
      absent: attendanceRecords.filter(
        (r) => r.status === 'absent_excused' || r.status === 'absent_unexcused'
      ).length,
      excused: attendanceRecords.filter((r) => r.status === 'absent_excused')
        .length,
      pending: attendanceRecords.filter((r) => r.status === 'pending').length,
    }

    return NextResponse.json({
      records: attendanceRecords,
      stats,
      player: {
        id: player.id,
        name: player.name,
      },
    })
  } catch (error) {
    console.error('Error fetching player attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
