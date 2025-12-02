'use client'

import { useState } from 'react'
import { generateBracketTestData } from '@/lib/utils/bracket-test-data'
import BracketVisualization from '@/components/tournaments/bracket-visualization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Calendar, Layers } from 'lucide-react'

const TEAM_OPTIONS = [9, 19, 33] as const

const BracketTestPage = () => {
  const [teamCount, setTeamCount] = useState<number>(9)
  
  // Generate mock data based on selected team count
  const bracketData = generateBracketTestData(teamCount)
  const { matches, players, totalRounds, bracketSize } = bracketData

  // Calculate stats
  const playedMatches = matches.filter((m) => m.played).length
  const totalMatches = matches.length
  const byeCount = bracketSize - teamCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold tracking-tight">
              Single Elimination Bracket
            </h1>
          </div>
          <p className="text-muted-foreground">
            Test visualization for tournament bracket display
          </p>
        </div>

        {/* Team count selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Select team count:</span>
            {TEAM_OPTIONS.map((count) => (
              <Button
                key={count}
                variant={teamCount === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTeamCount(count)}
              >
                {count} Teams
              </Button>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{players.length}</div>
                  <div className="text-xs text-muted-foreground">Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{bracketSize}</div>
                  <div className="text-xs text-muted-foreground">Bracket Size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{totalRounds}</div>
                  <div className="text-xs text-muted-foreground">Rounds</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{totalMatches}</div>
                  <div className="text-xs text-muted-foreground">Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{byeCount}</div>
                  <div className="text-xs text-muted-foreground">BYEs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bracket Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Tournament Bracket
                  <Badge variant="secondary">Mock Data</Badge>
                </CardTitle>
                <CardDescription>
                  {players.length}-team single elimination bracket ({bracketSize}-slot bracket with {byeCount} BYEs)
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {playedMatches}/{totalMatches} matches completed
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BracketVisualization
              matches={matches}
              totalRounds={totalRounds}
            />
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              All {players.length} teams registered for this tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BracketTestPage
