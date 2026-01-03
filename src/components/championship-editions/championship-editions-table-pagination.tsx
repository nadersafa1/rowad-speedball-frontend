import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

interface ChampionshipEditionsTablePaginationProps {
  pagination: Pagination
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
}

export function ChampionshipEditionsTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: ChampionshipEditionsTablePaginationProps) {
  const { page, limit, totalItems, totalPages } = pagination

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, totalItems)

  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex-1 text-sm text-muted-foreground'>
        Showing {startItem} to {endItem} of {totalItems} editions
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>Editions per page</p>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={limit.toString()} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          Page {page} of {totalPages}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onPageChange(1)}
            disabled={page === 1 || isLoading}
          >
            <span className='sr-only'>Go to first page</span>
            {'<<'}
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            <span className='sr-only'>Go to previous page</span>
            {'<'}
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            <span className='sr-only'>Go to next page</span>
            {'>'}
          </Button>
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages || isLoading}
          >
            <span className='sr-only'>Go to last page</span>
            {'>>'}
          </Button>
        </div>
      </div>
    </div>
  )
}
