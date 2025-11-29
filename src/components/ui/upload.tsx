'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface UploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onUpload?: (file: File) => void | Promise<void>
  accept?: string
  maxSize?: number // in bytes
  children?: React.ReactNode
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
}

const Upload = React.forwardRef<HTMLInputElement, UploadProps>(
  (
    {
      className,
      onUpload,
      accept = 'image/*',
      maxSize = 5 * 1024 * 1024, // 5MB default
      children,
      buttonText = 'Upload',
      buttonVariant = 'outline',
      buttonSize = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const handleFileChange = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        return
      }

      if (onUpload) {
        try {
          await onUpload(file)
        } catch (error) {
          // Error handling is done by parent component
          console.error('Upload error:', error)
        } finally {
          // Reset input
          if (inputRef.current) {
            inputRef.current.value = ''
          }
        }
      }
    }

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Input
          ref={inputRef}
          type='file'
          accept={accept}
          onChange={handleFileChange}
          className='hidden'
          disabled={disabled}
          {...props}
        />
        {children ? (
          <div onClick={() => inputRef.current?.click()}>
            {children}
          </div>
        ) : (
          <Button
            type='button'
            variant={buttonVariant}
            size={buttonSize}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            {buttonText}
          </Button>
        )}
      </div>
    )
  }
)
Upload.displayName = 'Upload'

export { Upload }

