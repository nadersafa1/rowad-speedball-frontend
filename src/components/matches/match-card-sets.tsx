interface SetScore {
  reg1Score: number
  reg2Score: number
  setNumber: number
}

interface MatchCardSetsProps {
  sets: SetScore[]
}

const MatchCardSets = ({ sets }: MatchCardSetsProps) => {
  if (sets.length === 0) return null

  return (
    <div className='mt-4 pt-4 border-t'>
      <div className='text-xs text-gray-500 mb-2 text-center'>Set Scores</div>
      <div className='flex justify-center gap-3'>
        {sets.map((set, idx) => (
          <div
            key={idx}
            className='flex flex-col items-center bg-gray-50 rounded px-3 py-1.5 min-w-[3rem]'
          >
            <div className='text-xs text-gray-500 mb-1'>Set {set.setNumber}</div>
            <div className='text-sm font-semibold'>
              <span
                className={
                  set.reg1Score > set.reg2Score
                    ? 'text-green-600'
                    : set.reg1Score < set.reg2Score
                    ? 'text-red-600'
                    : 'text-gray-600'
                }
              >
                {set.reg1Score}
              </span>
              <span className='text-gray-400 mx-1'>-</span>
              <span
                className={
                  set.reg2Score > set.reg1Score
                    ? 'text-green-600'
                    : set.reg2Score < set.reg1Score
                    ? 'text-red-600'
                    : 'text-gray-600'
                }
              >
                {set.reg2Score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MatchCardSets

