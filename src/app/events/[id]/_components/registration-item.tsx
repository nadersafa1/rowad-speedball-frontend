import { Button } from '@/components/ui'
import { Event, Registration } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import React from 'react'

interface RegistrationItemProps {
  registration: Registration
  event: Event
  canUpdate: boolean
  canDelete: boolean
  onEditRegistration: (id: string) => void
  onDeleteRegistration: (id: string) => void
}

const RegistrationItem = ({
  registration,
  event,
  canUpdate,
  canDelete,
  onEditRegistration,
  onDeleteRegistration,
}: RegistrationItemProps) => {
  return (
    <div
      key={registration.id}
      className='p-3 border rounded-lg flex items-center justify-between'
    >
      <div>
        <p className='font-medium'>
          {registration.players?.map((p) => p.name).join(' & ') || 'Unknown'}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        {event.format !== 'groups' && (
          <div className='text-right'>
            {registration.seed && (
              <p className='text-sm font-medium'>Seed #{registration.seed}</p>
            )}
          </div>
        )}
        {canUpdate && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => onEditRegistration(registration.id)}
          >
            <Pencil className='h-4 w-4' />
          </Button>
        )}
        {canDelete && !registration.groupId && (
          <Button
            variant='destructive'
            size='sm'
            onClick={() => onDeleteRegistration(registration.id)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  )
}

export default RegistrationItem
