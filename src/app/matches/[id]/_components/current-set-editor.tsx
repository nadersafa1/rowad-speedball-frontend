'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LiveScoreEditor from '@/components/matches/live-score-editor'
import type { Match, Set } from '@/types'

interface CurrentSetEditorProps {
  currentSet: Set
  match: Match
  onScoreUpdate: (
    setId: string,
    reg1Score: number,
    reg2Score: number
  ) => Promise<void>
  onMarkAsPlayed: (setId: string) => Promise<void>
}

const CurrentSetEditor = ({
  currentSet,
  match,
  onScoreUpdate,
  onMarkAsPlayed,
}: CurrentSetEditorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Set - Set {currentSet.setNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <LiveScoreEditor
          set={currentSet}
          match={match}
          onScoreUpdate={onScoreUpdate}
          onMarkAsPlayed={onMarkAsPlayed}
        />
      </CardContent>
    </Card>
  )
}

export default CurrentSetEditor

