'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { Test, PaginatedResponse } from '@/types'

interface TestComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowClear?: boolean
  showRecentItems?: boolean
  onCreateNew?: () => void
}

const TestCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select test...',
  className,
  allowClear = true,
  showRecentItems = true,
  onCreateNew,
}: TestComboboxProps) => {
  const fetchTests = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: Test[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getTests({
          q: query,
          limit,
          page,
        })) as PaginatedResponse<Test>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch tests')
      }
    },
    []
  )

  const fetchTest = React.useCallback(async (testId: string): Promise<Test> => {
    try {
      return (await apiClient.getTest(testId)) as Test
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch test')
    }
  }, [])

  const handleValueChange = React.useCallback(
    (testId: string | null | string[]) => {
      if (typeof testId === 'string' || testId === null) {
        onValueChange?.(testId || '')
      }
    },
    [onValueChange]
  )

  const getTestType = (test: Test) => {
    if (test.playingTime === 60 && test.recoveryTime === 30) {
      return 'Super Solo'
    } else if (test.playingTime === 30 && test.recoveryTime === 30) {
      return 'Juniors Solo'
    } else {
      return 'Speed Solo'
    }
  }

  const formatLabel = React.useCallback((test: Test) => {
    const testType = getTestType(test)
    return `${test.name} (${testType})`
  }, [])

  const formatSelectedLabel = React.useCallback((test: Test) => {
    const testType = getTestType(test)
    const date = new Date(test.dateConducted).toLocaleDateString()

    // For mobile, show compact label
    if (window.innerWidth < 768) {
      return `${test.name} (${testType})`
    }

    // For desktop, show more details
    return (
      <div className="flex flex-col">
        <span>{test.name} ({testType})</span>
        <span className="text-xs text-muted-foreground">
          Date: {date}
        </span>
      </div>
    )
  }, [])

  return (
    <BaseCombobox<Test>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchTests}
      fetchItem={fetchTest}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder="Search tests..."
      emptyMessage={(query) =>
        query ? 'No tests found.' : 'Start typing to search tests...'
      }
      className={className}
      formatLabel={formatLabel}
      formatSelectedLabel={formatSelectedLabel}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey="combobox-recent-tests"
      onCreateNew={onCreateNew}
      createNewLabel="Create New Test"
      aria-label="Select test"
      useMobileDialog={true}
      dialogTitle="Select a Test"
      dialogDescription="Search and select a test from the list"
    />
  )
}

export default TestCombobox
