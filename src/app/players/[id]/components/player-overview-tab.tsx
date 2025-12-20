'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  User,
  Calendar,
  MapPin,
  Trophy,
  BarChart3,
  Plus,
  BadgeCheck,
  UserCircle,
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
import { useOrganizationContext } from '@/hooks/use-organization-context'
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
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context
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
    <div className="space-y-8">
      {/* Player Header */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {userImage ? (
              <div className="shrink-0">
                <Image
                  src={userImage}
                  alt={selectedPlayer.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-rowad-100 rounded-full p-3 sm:p-4 shrink-0">
                <UserCircle className="h-8 w-8 sm:h-12 sm:w-12 text-rowad-600" />
              </div>
            )}
            <div className="flex-1 w-full min-w-0">
              <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words flex items-center gap-2">
                  {selectedPlayer.name}
                  {selectedPlayer.userId && (
                    <BadgeCheck className="h-6 w-6 text-blue-500" />
                  )}
                </h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Age: {selectedPlayer.age} years old</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Age Group: {selectedPlayer.ageGroup}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Gender:{' '}
                    {selectedPlayer.gender === 'male' ? 'Male' : 'Female'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">
                {stats.bestScore}
              </p>
              <p className="text-sm text-gray-600">Best Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {stats.avgScore}
              </p>
              <p className="text-sm text-gray-600">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <User className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {stats.testsCount}
              </p>
              <p className="text-sm text-gray-600">Tests Taken</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Matches */}
      <RecentMatchesCard playerId={playerId} />

      {/* Test Results History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Test Results History</CardTitle>
              <CardDescription>
                Complete performance history for this player
              </CardDescription>
            </div>

            {/* Admin Add Result Button */}
            {isSystemAdmin && (
              <Dialog open={resultFormOpen} onOpenChange={setResultFormOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
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
            <div className="space-y-4">
              {selectedPlayer.testResults.map((result, index) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {result.test?.name || `Test ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {result.test?.dateConducted &&
                          formatDate(result.test.dateConducted)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-rowad-600">
                        {result.leftHandScore +
                          result.rightHandScore +
                          result.forehandScore +
                          result.backhandScore}
                      </p>
                      <p className="text-sm text-gray-600">Total Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{result.leftHandScore}</p>
                      <p className="text-gray-600">Left Hand</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{result.rightHandScore}</p>
                      <p className="text-gray-600">Right Hand</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{result.forehandScore}</p>
                      <p className="text-gray-600">Forehand</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{result.backhandScore}</p>
                      <p className="text-gray-600">Backhand</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Test Results Yet
              </h3>
              <p className="text-gray-600">
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
