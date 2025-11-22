'use client'

import { useRouter } from 'next/navigation'
import { Archive, ChevronDownIcon, Play, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Match } from '@/types'

interface MatchEditDropdownProps {
  match: Match
  onArchiveModeClick: () => void
}

const MatchEditDropdown = ({
  match,
  onArchiveModeClick,
}: MatchEditDropdownProps) => {
  const router = useRouter()

  const handleLiveMode = () => {
    router.push(`/matches/${match.id}`)
  }

  return (
    <ButtonGroup>
      <Button variant='outline' size='sm' className='gap-2'>
        <span className='hidden sm:inline'>Edit Results</span>
        <span className='sm:hidden'>Edit</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='!pl-2'>
            <ChevronDownIcon className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='[--radius:1rem]'>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onArchiveModeClick}>
              <Archive className='h-4 w-4' />
              Archive Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLiveMode}>
              <Play className='h-4 w-4' />
              Live Mode
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className='text-red-500'>
              <TrashIcon className='h-4 w-4' />
              Cancel
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

export default MatchEditDropdown
