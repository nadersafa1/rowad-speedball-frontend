'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { PaginatedResponse } from '@/types'
import { PlayerMatch } from '@/types'
import MatchItem from './match-item'
import { Trophy } from 'lucide-react'

interface RecentMatchesCardProps {
  playerId: string
}

const RecentMatchesCard = ({ playerId }: RecentMatchesCardProps) => {
  const [matches, setMatches] = useState<PlayerMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(5)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0,
  })

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = (await apiClient.getPlayerMatches(playerId, {
          page: 1,
          limit,
        })) as PaginatedResponse<PlayerMatch>

        setMatches(response.data)
        setPagination({
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch matches'
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (playerId) {
      fetchMatches()
    }
  }, [playerId, limit])

  const handleShowMore = () => {
    setLimit((prev) => Math.min(prev + 10, pagination.totalItems))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
          <CardDescription>
            Recent match results for this player
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
          <CardDescription>
            Recent match results for this player
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                setIsLoading(true)
              }}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
        <CardDescription>
          Recent match results for this player
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Matches Yet
            </h3>
            <p className="text-gray-600">
              This player hasn&apos;t played any matches yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchItem key={match.id} match={match} />
            ))}

            {limit < pagination.totalItems && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full"
                >
                  Show More ({pagination.totalItems - limit} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentMatchesCard

