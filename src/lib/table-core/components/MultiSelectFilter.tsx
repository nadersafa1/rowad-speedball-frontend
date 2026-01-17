/**
 * Table Core - MultiSelectFilter Component
 * Reusable multi-select filter component for tables
 */

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TableFilter } from './TableFilter'

export interface MultiSelectOption {
  label: string
  value: string
}

export interface MultiSelectFilterProps {
  label?: string
  htmlFor?: string
  options: MultiSelectOption[]
  selectedValues?: string[]
  onSelectionChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  error?: string
  required?: boolean
  maxDisplay?: number // Maximum number of selected items to display before showing count
}

export function MultiSelectFilter({
  label,
  htmlFor,
  options,
  selectedValues = [],
  onSelectionChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className,
  error,
  required = false,
  maxDisplay = 2,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onSelectionChange?.(newValues)
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange?.(selectedValues.filter((v) => v !== value))
  }

  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(opt.value)
  )

  const displayCount = selectedValues.length
  const displayItems = selectedOptions.slice(0, maxDisplay)
  const remainingCount = displayCount - maxDisplay

  return (
    <TableFilter
      label={label}
      htmlFor={htmlFor}
      error={error}
      required={required}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={htmlFor}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className={cn(
              'w-full justify-between min-h-10 h-auto',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            <div className='flex flex-wrap gap-1 flex-1'>
              {displayCount === 0 ? (
                <span className='text-muted-foreground'>{placeholder}</span>
              ) : (
                <>
                  {displayItems.map((option) => (
                    <Badge
                      key={option.value}
                      variant='secondary'
                      className='mr-1'
                    >
                      {option.label}
                      <button
                        className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRemove(option.value, e as any)
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => handleRemove(option.value, e)}
                      >
                        <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                      </button>
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant='secondary' className='mr-1'>
                      +{remainingCount} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedValues.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TableFilter>
  )
}
