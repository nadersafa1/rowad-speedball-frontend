interface SetScore {
  reg1Score: number
  reg2Score: number
  setNumber: number
  played?: boolean
}

interface MatchCardSetsProps {
  sets: SetScore[]
}

const MatchCardSets = ({ sets }: MatchCardSetsProps) => {
  if (sets.length === 0) return null

  return (
    <div className='mt-4 pt-4 border-t'>
      <div className='text-xs text-muted-foreground mb-2 text-center'>Set Scores</div>
      <div className='flex justify-center gap-3'>
        {sets.map((set, idx) => {
          const isIncomplete = set.played === false
          return (
            <div
              key={idx}
              className={`flex flex-col items-center rounded px-3 py-1.5 min-w-[3rem] ${
                isIncomplete
                  ? 'bg-blue-500/10 border border-blue-500/30 dark:bg-blue-500/20'
                  : 'bg-muted'
              }`}
            >
              <div className='text-xs text-muted-foreground mb-1'>
                Set {set.setNumber}
                {isIncomplete && (
                  <span className='ml-1 text-blue-600 dark:text-blue-400 font-medium'>Live</span>
                )}
              </div>
              <div className='text-sm font-semibold'>
                <span
                  className={
                    set.reg1Score > set.reg2Score
                      ? 'text-green-600 dark:text-green-400'
                      : set.reg1Score < set.reg2Score
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  }
                >
                  {set.reg1Score}
                </span>
                <span className='text-muted-foreground mx-1'>-</span>
                <span
                  className={
                    set.reg2Score > set.reg1Score
                      ? 'text-green-600 dark:text-green-400'
                      : set.reg2Score < set.reg1Score
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  }
                >
                  {set.reg2Score}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MatchCardSets

