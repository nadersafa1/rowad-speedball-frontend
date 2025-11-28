import React from 'react'
import { Spinner } from './spinner'

const Loading = () => {
  return (
    <div className='flex min-h-[90dvh] justify-center items-center'>
      <Spinner className='size-8 text-green-500' />
    </div>
  )
}

export default Loading
