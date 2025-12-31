'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
}

/**
 * LoadingButton Component
 *
 * A button that displays a loading spinner and optional text when isLoading is true.
 * Automatically disables the button during loading state.
 *
 * @example
 * <LoadingButton isLoading={isSubmitting} loadingText="Saving...">
 *   Save Changes
 * </LoadingButton>
 *
 * @example
 * <LoadingButton isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
 *   Save Player
 * </LoadingButton>
 */
export const LoadingButton = ({
  isLoading = false,
  loadingText,
  icon,
  children,
  disabled,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <div className='flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          {loadingText || children}
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          {icon}
          {children}
        </div>
      )}
    </Button>
  )
}
