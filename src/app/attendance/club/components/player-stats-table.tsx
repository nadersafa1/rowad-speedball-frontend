/**
 * Player Statistics Table
 * Displays per-player attendance statistics for organization view
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PlayerStat {
  playerId: string
  playerName: string
  total: number
  present: number
  absent: number
  attendanceRate: number
}

interface PlayerStatsTableProps {
  playerStats: PlayerStat[]
  isLoading?: boolean
}

type SortColumn = 'playerName' | 'total' | 'present' | 'absent' | 'attendanceRate'
type SortDirection = 'asc' | 'desc'

export function PlayerStatsTable({
  playerStats,
  isLoading = false,
}: PlayerStatsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('attendanceRate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sort the player stats
  const sortedStats = useMemo(() => {
    const sorted = [...playerStats].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortColumn) {
        case 'playerName':
          aValue = a.playerName.toLowerCase()
          bValue = b.playerName.toLowerCase()
          break
        case 'total':
          aValue = a.total
          bValue = b.total
          break
        case 'present':
          aValue = a.present
          bValue = b.present
          break
        case 'absent':
          aValue = a.absent
          bValue = b.absent
          break
        case 'attendanceRate':
          aValue = a.attendanceRate
          bValue = b.attendanceRate
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [playerStats, sortColumn, sortDirection])

  // Calculate pagination
  const totalItems = sortedStats.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedStats = sortedStats.slice(startIndex, endIndex)

  // Reset to page 1 when filters change (when playerStats changes)
  useEffect(() => {
    setCurrentPage(1)
  }, [playerStats])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (playerStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No player statistics available for the selected filters
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('playerName')}
                    className="h-auto p-0 hover:bg-transparent font-medium"
                  >
                    Player Name
                    <SortIcon column="playerName" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('total')}
                    className="h-auto p-0 hover:bg-transparent font-medium"
                  >
                    Total Sessions
                    <SortIcon column="total" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('present')}
                    className="h-auto p-0 hover:bg-transparent font-medium"
                  >
                    Present
                    <SortIcon column="present" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('absent')}
                    className="h-auto p-0 hover:bg-transparent font-medium"
                  >
                    Absent
                    <SortIcon column="absent" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('attendanceRate')}
                    className="h-auto p-0 hover:bg-transparent font-medium"
                  >
                    Attendance Rate
                    <SortIcon column="attendanceRate" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStats.map((stat, index) => (
                <TableRow key={stat.playerId}>
                  <TableCell className="font-medium">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {stat.playerName}
                  </TableCell>
                  <TableCell className="text-center">
                    {stat.total}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-medium">
                      {stat.present}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 font-medium">
                      {stat.absent}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        stat.attendanceRate >= 80
                          ? 'default'
                          : stat.attendanceRate >= 60
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        stat.attendanceRate >= 80
                          ? 'bg-green-100 text-green-800'
                          : stat.attendanceRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {stat.attendanceRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-2 py-2 border-t">
            {/* Results info */}
            <div className="text-muted-foreground text-xs md:text-sm text-center md:text-left">
              <span className="hidden sm:inline">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} players
              </span>
              <span className="sm:hidden">
                {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              {/* Rows per page */}
              <div className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Rows per page</span>
                  <span className="sm:hidden">Per page</span>
                </p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex-1 sm:flex-initial gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="text-xs sm:text-sm font-medium whitespace-nowrap px-2">
                  <span className="hidden sm:inline">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="sm:hidden">
                    {currentPage}/{totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex-1 sm:flex-initial gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
