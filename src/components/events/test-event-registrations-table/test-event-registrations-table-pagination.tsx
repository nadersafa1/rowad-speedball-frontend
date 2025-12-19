import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TestEventRegistrationsTablePaginationProps {
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
}

export const TestEventRegistrationsTablePagination = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: TestEventRegistrationsTablePaginationProps) => {
  const startItem = pagination.page * pagination.limit - pagination.limit + 1
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.totalItems
  )

  return (
    <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-2 py-2'>
      <div className='text-muted-foreground text-xs md:text-sm text-center md:text-left'>
        <span className='hidden sm:inline'>
          Showing {startItem} to {endItem} of {pagination.totalItems}{' '}
          registrations
        </span>
        <span className='sm:hidden'>
          {startItem}-{endItem} of {pagination.totalItems}
        </span>
      </div>

      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4'>
        <div className='flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto'>
          <p className='text-xs sm:text-sm font-medium whitespace-nowrap'>
            <span className='hidden sm:inline'>Rows per page</span>
            <span className='sm:hidden'>Per page</span>
          </p>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className='h-8 w-[70px] sm:w-[70px]'>
              <SelectValue placeholder={pagination.limit} />
            </SelectTrigger>
            <SelectContent side='top'>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center justify-center gap-2 w-full sm:w-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className='flex-1 sm:flex-initial gap-1'
          >
            <ChevronLeft className='h-4 w-4' />
            <span className='hidden sm:inline'>Previous</span>
          </Button>
          <div className='text-xs sm:text-sm font-medium whitespace-nowrap px-2'>
            <span className='hidden sm:inline'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <span className='sm:hidden'>
              {pagination.page}/{pagination.totalPages}
            </span>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className='flex-1 sm:flex-initial gap-1'
          >
            <span className='hidden sm:inline'>Next</span>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

