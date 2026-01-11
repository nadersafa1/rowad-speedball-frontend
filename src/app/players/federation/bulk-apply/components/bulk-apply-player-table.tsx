'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getAgeGroup } from '@/db/schema'
import { AlertCircle } from 'lucide-react'

interface PlayerWithEligibility {
  id: string
  name: string
  dateOfBirth: string
  gender: string
  isEligible: boolean
  ineligibilityReason: string | null
}

interface BulkApplyPlayerTableProps {
  players: PlayerWithEligibility[]
  selectedPlayerIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  showIneligible: boolean
}

export const BulkApplyPlayerTable = ({
  players,
  selectedPlayerIds,
  onSelectionChange,
  showIneligible,
}: BulkApplyPlayerTableProps) => {
  // Convert selectedPlayerIds to row selection state
  const rowSelectionState = React.useMemo(() => {
    const state: Record<string, boolean> = {}
    players.forEach((player, index) => {
      if (selectedPlayerIds.includes(player.id)) {
        state[index] = true
      }
    })
    return state
  }, [players, selectedPlayerIds])

  const columns = React.useMemo<ColumnDef<PlayerWithEligibility>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const eligiblePlayers = players.filter((p) => p.isEligible)
          const hasEligible = eligiblePlayers.length > 0

          return (
            <Checkbox
              checked={
                hasEligible &&
                table.getIsAllPageRowsSelected() &&
                table.getIsSomePageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label='Select all'
              disabled={!hasEligible}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
            disabled={!row.original.isEligible}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Player Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{row.original.name}</span>
            {!row.original.isEligible && showIneligible && (
              <Badge variant='destructive' className='gap-1'>
                <AlertCircle className='h-3 w-3' />
                Ineligible
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'ageGroup',
        header: 'Age Group',
        cell: ({ row }) => {
          const ageGroup = row.original.dateOfBirth
            ? getAgeGroup(row.original.dateOfBirth)
            : 'N/A'
          return <span>{ageGroup}</span>
        },
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <span className='capitalize'>{row.original.gender}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          if (row.original.isEligible) {
            return <Badge variant='outline'>Eligible</Badge>
          }
          return (
            <span className='text-sm text-destructive'>
              {row.original.ineligibilityReason}
            </span>
          )
        },
      },
    ],
    [players, showIneligible]
  )

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: (row) => row.original.isEligible,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelectionState) : updater

      const selectedIds = Object.keys(newSelection)
        .filter((key) => newSelection[key])
        .map((index) => players[parseInt(index)].id)

      onSelectionChange(selectedIds)
    },
    state: {
      rowSelection: rowSelectionState,
    },
  })

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={!row.original.isEligible ? 'opacity-50' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No players found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
