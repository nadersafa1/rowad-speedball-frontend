/**
 * Table Core - BulkActionsToolbar Component
 * Reusable toolbar for bulk actions on selected rows
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onClick: () => void | Promise<void>
  disabled?: boolean
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationDescription?: string
}

export interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  actions?: BulkAction[]
  children?: React.ReactNode
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  actions = [],
  children,
}: BulkActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleAction = async (action: BulkAction) => {
    setIsProcessing(true)
    try {
      await action.onClick()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Custom children content (e.g., custom selectors or actions) */}
            {children}

            {/* Predefined actions */}
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                disabled={isProcessing || action.disabled}
                onClick={() => handleAction(action)}
                className="w-full sm:w-auto"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}

            {/* Clear Selection Button */}
            <Button
              variant="outline"
              onClick={onClearSelection}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
