'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LoadingSwap } from '@/components/ui/loading-swap'

export const SetupOrganizationButton = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/setup-organization', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to setup organization')
      }

      toast.success('Rowad organization created successfully!')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to setup organization'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSetup} disabled={isLoading}>
      <LoadingSwap isLoading={isLoading}>Setup Rowad Organization</LoadingSwap>
    </Button>
  )
}

