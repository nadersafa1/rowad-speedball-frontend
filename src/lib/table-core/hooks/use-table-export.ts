/**
 * Table Core - useTableExport Hook
 * Manages CSV and Excel export functionality with loading state
 */

'use client'

import { useCallback, useState } from 'react'
import { BaseTableEntity } from '../types'
import { exportToCSV, exportToExcel } from '../utils'

export type ExportFormat = 'csv' | 'xlsx'

export interface UseTableExportOptions<TData extends BaseTableEntity> {
  data: TData[]
  columns: Array<{ key: keyof TData; label: string }>
  filename: string
  format?: ExportFormat // Export format: 'csv' or 'xlsx' (default: 'csv')
  enabled?: boolean
  selectedOnly?: boolean
  selectedData?: TData[]
  showLoadingDelay?: number // Delay in ms to show loading state (default: 100)
}

export interface UseTableExportReturn {
  handleExport: (format?: ExportFormat) => Promise<void>
  isExporting: boolean
}

export function useTableExport<TData extends BaseTableEntity>({
  data,
  columns,
  filename,
  format = 'csv',
  enabled = true,
  selectedOnly = false,
  selectedData,
  showLoadingDelay = 100,
}: UseTableExportOptions<TData>): UseTableExportReturn {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(
    async (exportFormat?: ExportFormat) => {
      if (!enabled) return

      setIsExporting(true)
      try {
        // Add small delay to show loading state for better UX
        if (showLoadingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, showLoadingDelay))
        }

        // Determine which data to export
        const dataToExport = selectedOnly && selectedData ? selectedData : data

        // Use provided format or default
        const finalFormat = exportFormat || format

        // Generate filename with timestamp if not already included
        const timestamp = new Date().toISOString().split('T')[0]
        const extension = finalFormat === 'xlsx' ? '.xlsx' : '.csv'
        const baseFilename =
          filename.endsWith('.csv') || filename.endsWith('.xlsx')
            ? filename.replace(/\.(csv|xlsx)$/, '')
            : filename
        const finalFilename = `${baseFilename}-${timestamp}${extension}`

        // Export based on format
        if (finalFormat === 'xlsx') {
          exportToExcel(dataToExport, columns, finalFilename)
        } else {
          exportToCSV(dataToExport, columns, finalFilename)
        }
      } catch (error) {
        console.error('Export failed:', error)
        // Could add toast notification here if needed
      } finally {
        setIsExporting(false)
      }
    },
    [
      data,
      columns,
      filename,
      format,
      enabled,
      selectedOnly,
      selectedData,
      showLoadingDelay,
    ]
  )

  return {
    handleExport,
    isExporting,
  }
}
