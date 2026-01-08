'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  User,
  Calendar,
  Trophy,
  BarChart3,
  Plus,
  BadgeCheck,
  UserCircle,
  Hand,
  Building2,
  Cake,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useResultPermissions } from '@/hooks/authorization/use-result-permissions'
import ResultsForm from '@/components/results/results-form'
import RecentMatchesCard from './recent-matches-card'
import { formatDate } from '@/lib/utils'
import type { PlayerWithResults } from '@/types'

interface PlayerOverviewTabProps {
  selectedPlayer: PlayerWithResults
  playerId: string
  userImage: string | null
  onResultAdded: () => void
}

const PlayerOverviewTab = ({
  selectedPlayer,
  playerId,
  userImage,
  onResultAdded,
}: PlayerOverviewTabProps) => {
  const { canCreate } = useResultPermissions(null, null)
  const [resultFormOpen, setResultFormOpen] = useState(false)

  const calculateStats = () => {
    if (!selectedPlayer?.testResults || selectedPlayer.testResults.length === 0)
      return null

    const totalScores = selectedPlayer.testResults.map(
      (result) =>
        result.leftHandScore +
        result.rightHandScore +
        result.forehandScore +
        result.backhandScore
    )

    const avgScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length
    const bestScore = Math.max(...totalScores)
    const testsCount = selectedPlayer.testResults.length

    return { avgScore: avgScore.toFixed(1), bestScore, testsCount }
  }

  const stats = calculateStats()

  return (
    <div className='space-y-8'>
      {/* Player Profile Card */}
      <Card className='overflow-hidden'>
        <div className='bg-gradient-to-r from-rowad-600 to-rowad-700 h-24 sm:h-32' />
        <CardContent className='-mt-12 sm:-mt-16'>
          <div className='flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6'>
            {/* Avatar */}
            <div className='relative shrink-0'>
              {userImage ? (
                <Image
                  src={userImage}
                  alt={selectedPlayer.name}
                  width={96}
                  height={96}
                  className='rounded-full object-cover border-4 border-background shadow-lg w-24 h-24 sm:w-28 sm:h-28'
                />
              ) : (
                <div className='bg-rowad-100 rounded-full p-4 sm:p-5 border-4 border-background shadow-lg'>
                  <UserCircle className='h-14 w-14 sm:h-16 sm:w-16 text-rowad-600' />
                </div>
              )}
              {selectedPlayer.userId && (
                <div className='absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-background'>
                  <BadgeCheck className='h-4 w-4 text-white' />
                </div>
              )}
            </div>

            {/* Name & Badges */}
            <div className='flex-1 text-center sm:text-left pb-2'>
              <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>
                {selectedPlayer.name}
              </h1>
              {selectedPlayer.nameRtl && (
                <p className='text-lg text-muted-foreground mt-1' dir='rtl'>
                  {selectedPlayer.nameRtl}
                </p>
              )}
              <div className='flex flex-wrap justify-center sm:justify-start gap-2 mt-3'>
                <Badge variant='secondary' className='gap-1'>
                  <Users className='h-3 w-3' />
                  {selectedPlayer.ageGroup}
                </Badge>
                <Badge
                  variant='outline'
                  className={
                    selectedPlayer.gender === 'male'
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-pink-300 text-pink-700 bg-pink-50'
                  }
                >
                  {selectedPlayer.gender === 'male' ? 'Male' : 'Female'}
                </Badge>
                {selectedPlayer.organizationName && (
                  <Badge variant='outline' className='gap-1'>
                    <Building2 className='h-3 w-3' />
                    {selectedPlayer.organizationName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Player Details Grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t'>
            <div className='flex flex-col items-center p-3 rounded-lg bg-muted/50'>
              <Cake className='h-5 w-5 text-muted-foreground mb-1' />
              <span className='text-sm text-muted-foreground'>Age</span>
              <span className='font-semibold'>{selectedPlayer.age} years</span>
            </div>
            <div className='flex flex-col items-center p-3 rounded-lg bg-muted/50'>
              <Calendar className='h-5 w-5 text-muted-foreground mb-1' />
              <span className='text-sm text-muted-foreground'>Birth Date</span>
              <span className='font-semibold'>
                {formatDate(selectedPlayer.dateOfBirth)}
              </span>
            </div>
            <div className='flex flex-col items-center p-3 rounded-lg bg-muted/50'>
              <Hand className='h-5 w-5 text-muted-foreground mb-1' />
              <span className='text-sm text-muted-foreground'>
                Preferred Hand
              </span>
              <span className='font-semibold capitalize'>
                {selectedPlayer.preferredHand}
              </span>
            </div>
            <div className='flex flex-col items-center p-3 rounded-lg bg-muted/50'>
              <User className='h-5 w-5 text-muted-foreground mb-1' />
              <span className='text-sm text-muted-foreground'>Account</span>
              <span className='font-semibold'>
                {selectedPlayer.userId ? 'Linked' : 'Not Linked'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardContent className='text-center'>
              <Trophy className='h-8 w-8 text-yellow-500 mx-auto mb-2' />
              <p className='text-2xl font-bold text-yellow-600'>
                {stats.bestScore}
              </p>
              <p className='text-sm text-muted-foreground'>Best Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='text-center'>
              <BarChart3 className='h-8 w-8 text-blue-500 mx-auto mb-2' />
              <p className='text-2xl font-bold text-blue-600'>
                {stats.avgScore}
              </p>
              <p className='text-sm text-muted-foreground'>Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='text-center'>
              <User className='h-8 w-8 text-green-500 mx-auto mb-2' />
              <p className='text-2xl font-bold text-green-600'>
                {stats.testsCount}
              </p>
              <p className='text-sm text-muted-foreground'>Tests Taken</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Matches */}
      <RecentMatchesCard playerId={playerId} />

      {/* Test Results History */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle>Test Results History</CardTitle>
              <CardDescription>
                Complete performance history for this player
              </CardDescription>
            </div>

            {/* Add Result Button - requires create permission */}
            {canCreate && (
              <Dialog open={resultFormOpen} onOpenChange={setResultFormOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2 bg-green-600 hover:bg-green-700'>
                    <Plus className='h-4 w-4' />
                    Add Result
                  </Button>
                </DialogTrigger>
                <ResultsForm
                  preselectedPlayerId={playerId}
                  onSuccess={() => {
                    setResultFormOpen(false)
                    onResultAdded()
                  }}
                  onCancel={() => setResultFormOpen(false)}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedPlayer.testResults &&
          selectedPlayer.testResults.length > 0 ? (
            <div className='space-y-4'>
              {selectedPlayer.testResults.map((result, index) => (
                <div
                  key={result.id}
                  className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='font-semibold'>
                        {result.test?.name || `Test ${index + 1}`}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {result.test?.dateConducted &&
                          formatDate(result.test.dateConducted)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-bold text-rowad-600'>
                        {result.leftHandScore +
                          result.rightHandScore +
                          result.forehandScore +
                          result.backhandScore}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Total Score
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div className='text-center'>
                      <p className='font-medium'>{result.leftHandScore}</p>
                      <p className='text-muted-foreground'>Left Hand</p>
                    </div>
                    <div className='text-center'>
                      <p className='font-medium'>{result.rightHandScore}</p>
                      <p className='text-muted-foreground'>Right Hand</p>
                    </div>
                    <div className='text-center'>
                      <p className='font-medium'>{result.forehandScore}</p>
                      <p className='text-muted-foreground'>Forehand</p>
                    </div>
                    <div className='text-center'>
                      <p className='font-medium'>{result.backhandScore}</p>
                      <p className='text-muted-foreground'>Backhand</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>
                No Test Results Yet
              </h3>
              <p className='text-muted-foreground'>
                This player hasn&apos;t participated in any tests yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PlayerOverviewTab
