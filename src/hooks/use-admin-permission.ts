'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export const useAdminPermission = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  useEffect(() => {
    // Don't check permissions while session is still loading
    if (isSessionLoading) {
      return
    }

    const checkAdminPermission = async () => {
      if (!session?.user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Set loading to true before making the API call
      setIsLoading(true)

      try {
        const { data } = await authClient.admin.hasPermission({
          permission: { user: ['list'] },
        })
        // Update both states together to ensure they're in sync
        setIsAdmin(data?.success ?? false)
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking admin permission:', error)
        setIsAdmin(false)
        setIsLoading(false)
      }
    }

    checkAdminPermission()
  }, [session?.user, isSessionLoading])

  return { isAdmin, isLoading: isLoading || isSessionLoading }
}
