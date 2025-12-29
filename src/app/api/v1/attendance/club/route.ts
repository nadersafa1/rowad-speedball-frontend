/**
 * Club Attendance API
 * GET /api/v1/attendance/club - Get attendance records for all players in club
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  trainingSessionAttendance,
  trainingSessions,
  players,
} from '@/db/schema'
import { eq, and, gte, lte, sql, ilike, inArray } from 'drizzle-orm'
import { getOrganizationContext } from '@/lib/organization-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = await getOrganizationContext()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has organization access (coach, admin, or owner)
    if (!context.organization?.id) {
      return NextResponse.json(
        { error: 'No organization context found' },
        { status: 403 }
      )
    }

    const organizationId = context.organization.id

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const sessionType = searchParams.get('sessionType')
    const playerName = searchParams.get('playerName')
    const gender = searchParams.get('gender')
    const ageGroup = searchParams.get('ageGroup')
    const teamLevel = searchParams.get('teamLevel')

    // Build query conditions
    const conditions = [eq(players.organizationId, organizationId)]

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
      conditions.push(sql`${sessionType} = ANY(${trainingSessions.type})`)
    }

    if (playerName && playerName.trim() !== '') {
      conditions.push(ilike(players.name, `%${playerName}%`))
    }

    if (gender && gender !== 'all') {
      conditions.push(eq(players.gender, gender as 'male' | 'female'))
    }

    if (ageGroup && ageGroup !== 'all') {
      conditions.push(sql`${ageGroup} = ANY(${trainingSessions.ageGroups})`)
    }

    if (teamLevel && teamLevel !== 'all') {
      conditions.push(
        eq(players.teamLevel, teamLevel as 'team_a' | 'team_b' | 'team_c')
      )
    }

    // Fetch attendance records with session and player details
    const attendanceRecords = await db
      .select({
        id: trainingSessionAttendance.id,
        status: trainingSessionAttendance.status,
        playerId: trainingSessionAttendance.playerId,
        trainingSessionId: trainingSessionAttendance.trainingSessionId,
        player: {
          id: players.id,
          name: players.name,
          nameRtl: players.nameRtl,
          gender: players.gender,
        },
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
      .innerJoin(players, eq(trainingSessionAttendance.playerId, players.id))
      .where(and(...conditions))
      .orderBy(sql`${trainingSessions.date} DESC, ${players.name} ASC`)

    // Calculate organization-wide statistics
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

    // Get unique players count
    const uniquePlayers = new Set(attendanceRecords.map((r) => r.playerId))
    const playerCount = uniquePlayers.size

    // Calculate per-player stats
    const playerStats = Array.from(uniquePlayers).map((playerId) => {
      const playerRecords = attendanceRecords.filter(
        (r) => r.playerId === playerId
      )
      const player = playerRecords[0]?.player

      return {
        playerId,
        playerName: player?.name || 'Unknown',
        total: playerRecords.length,
        present: playerRecords.filter(
          (r) => r.status === 'present' || r.status === 'late'
        ).length,
        absent: playerRecords.filter(
          (r) =>
            r.status === 'absent_excused' || r.status === 'absent_unexcused'
        ).length,
        attendanceRate:
          playerRecords.length > 0
            ? Math.round(
                ((playerRecords.filter(
                  (r) => r.status === 'present' || r.status === 'late'
                ).length +
                  playerRecords.filter((r) => r.status === 'absent_excused')
                    .length) /
                  playerRecords.length) *
                  100
              )
            : 0,
      }
    })

    return NextResponse.json({
      stats,
      playerCount,
      playerStats: playerStats.sort(
        (a, b) => b.attendanceRate - a.attendanceRate
      ),
      organization: {
        id: context.organization.id,
        name: context.organization.name,
      },
    })
  } catch (error) {
    console.error('Error fetching Club Attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
