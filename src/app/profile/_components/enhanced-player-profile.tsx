'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Edit,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDisplayDate } from '@/lib/utils/date-formatting'

interface EnhancedPlayerProfileProps {
  player: any // Using any for now since player type from DB might differ
  userId: string
  onEditClick: () => void
}

// Dummy data for demonstration
const dummyTrainingSessions = [
  {
    id: '1',
    date: '2025-01-15',
    name: 'Speed Training',
    status: 'attended' as const,
    duration: '90 min',
  },
  {
    id: '2',
    date: '2025-01-12',
    name: 'Technique Practice',
    status: 'attended' as const,
    duration: '60 min',
  },
  {
    id: '3',
    date: '2025-01-10',
    name: 'Match Preparation',
    status: 'attended' as const,
    duration: '120 min',
  },
  {
    id: '4',
    date: '2025-01-08',
    name: 'Fitness Training',
    status: 'absent' as const,
    duration: '75 min',
  },
  {
    id: '5',
    date: '2025-01-05',
    name: 'Speed Training',
    status: 'attended' as const,
    duration: '90 min',
  },
]

const dummyLatestMatches = [
  {
    id: '1',
    eventName: 'Winter Championship',
    opponent: 'John Smith',
    date: '2025-01-14',
    result: 'won',
    score: '3-1',
    sets: [
      { player1: 11, player2: 8 },
      { player1: 9, player2: 11 },
      { player1: 11, player2: 6 },
      { player1: 11, player2: 9 },
    ],
  },
  {
    id: '2',
    eventName: 'Winter Championship',
    opponent: 'Sarah Johnson',
    date: '2025-01-10',
    result: 'lost',
    score: '1-3',
    sets: [
      { player1: 8, player2: 11 },
      { player1: 11, player2: 9 },
      { player1: 7, player2: 11 },
      { player1: 9, player2: 11 },
    ],
  },
  {
    id: '3',
    eventName: 'Weekly Tournament',
    opponent: 'Mike Davis',
    date: '2025-01-07',
    result: 'won',
    score: '3-0',
    sets: [
      { player1: 11, player2: 5 },
      { player1: 11, player2: 7 },
      { player1: 11, player2: 9 },
    ],
  },
]

const EnhancedPlayerProfile = ({
  player,
  userId,
  onEditClick,
}: EnhancedPlayerProfileProps) => {
  // Calculate stats from dummy data
  const attendanceRate =
    (dummyTrainingSessions.filter((s) => s.status === 'attended').length /
      dummyTrainingSessions.length) *
    100

  const totalMatches = dummyLatestMatches.length
  const wins = dummyLatestMatches.filter((m) => m.result === 'won').length
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0

  const recentSessions = dummyTrainingSessions.slice(0, 5)
  const recentMatches = dummyLatestMatches.slice(0, 5)

  return (
    <div className='space-y-6'>
      {/* Header with Edit Toggle */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Player Profile</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Your performance overview and statistics
          </p>
        </div>
        <Button variant='outline' onClick={onEditClick} className='gap-2'>
          <Edit className='h-4 w-4' />
          Edit Profile
        </Button>
      </div>

      {/* Key Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                  Attendance Rate
                </p>
                <p className='text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2'>
                  {attendanceRate.toFixed(0)}%
                </p>
                <p className='text-xs text-blue-600 dark:text-blue-400 mt-1'>
                  {
                    dummyTrainingSessions.filter((s) => s.status === 'attended')
                      .length
                  }{' '}
                  of {dummyTrainingSessions.length} sessions
                </p>
              </div>
              <div className='bg-blue-200 dark:bg-blue-800 rounded-full p-3'>
                <CheckCircle2 className='h-6 w-6 text-blue-600 dark:text-blue-300' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                  Win Rate
                </p>
                <p className='text-3xl font-bold text-green-900 dark:text-green-100 mt-2'>
                  {winRate.toFixed(0)}%
                </p>
                <p className='text-xs text-green-600 dark:text-green-400 mt-1'>
                  {wins} wins of {totalMatches} matches
                </p>
              </div>
              <div className='bg-green-200 dark:bg-green-800 rounded-full p-3'>
                <Trophy className='h-6 w-6 text-green-600 dark:text-green-300' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-purple-600 dark:text-purple-400'>
                  Total Matches
                </p>
                <p className='text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2'>
                  {totalMatches}
                </p>
                <p className='text-xs text-purple-600 dark:text-purple-400 mt-1'>
                  Last 30 days
                </p>
              </div>
              <div className='bg-purple-200 dark:bg-purple-800 rounded-full p-3'>
                <Activity className='h-6 w-6 text-purple-600 dark:text-purple-300' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>
                  Training Hours
                </p>
                <p className='text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2'>
                  8.5h
                </p>
                <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'>
                  This month
                </p>
              </div>
              <div className='bg-amber-200 dark:bg-amber-800 rounded-full p-3'>
                <Clock className='h-6 w-6 text-amber-600 dark:text-amber-300' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Training Sessions Attendance */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Training Sessions Attendance
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-1'>
                  Your recent training session participation
                </p>
              </div>
              <Badge variant='outline' className='text-xs'>
                {recentSessions.length} sessions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div
                      className={`rounded-full p-2 ${
                        session.status === 'attended'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}
                    >
                      {session.status === 'attended' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>{session.name}</p>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <Calendar className='h-3 w-3' />
                        <span>{formatDisplayDate(session.date)}</span>
                        <span>•</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      session.status === 'attended' ? 'default' : 'destructive'
                    }
                    className='ml-2 shrink-0'
                  >
                    {session.status === 'attended' ? 'Attended' : 'Absent'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium'>Improvement</span>
                </div>
                <span className='text-lg font-bold text-green-600'>+12%</span>
              </div>
              <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <Target className='h-4 w-4 text-blue-600' />
                  <span className='text-sm font-medium'>Goals Met</span>
                </div>
                <span className='text-lg font-bold text-blue-600'>3/5</span>
              </div>
              <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <Award className='h-4 w-4 text-purple-600' />
                  <span className='text-sm font-medium'>Ranking</span>
                </div>
                <span className='text-lg font-bold text-purple-600'>#15</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Matches */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='h-5 w-5' />
                Latest Matches
              </CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                Your recent match results and performance
              </p>
            </div>
            <Badge variant='outline' className='text-xs'>
              {recentMatches.length} matches
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='font-semibold truncate'>
                        {match.eventName}
                      </p>
                      <Badge
                        variant={
                          match.result === 'won' ? 'default' : 'destructive'
                        }
                        className='shrink-0'
                      >
                        {match.result === 'won' ? 'Won' : 'Lost'}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                      <span>vs {match.opponent}</span>
                      <span>•</span>
                      <span>{formatDisplayDate(match.date)}</span>
                    </div>
                  </div>
                  <div className='text-right ml-4 shrink-0'>
                    <p className='text-2xl font-bold'>{match.score}</p>
                    <p className='text-xs text-muted-foreground'>Final Score</p>
                  </div>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  {match.sets.map((set, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        set.player1 > set.player2
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {set.player1}-{set.player2}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedPlayerProfile
