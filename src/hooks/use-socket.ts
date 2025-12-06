'use client'

import { useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { authClient } from '@/lib/auth-client'
import { useSocketStore } from '@/store/socket-store'
import { SOCKET_EVENTS, getSocketServerUrl } from '@/lib/socket'
import type {
  JoinMatchPayload,
  LeaveMatchPayload,
  GetMatchPayload,
  CreateSetPayload,
  UpdateSetScorePayload,
  MarkSetPlayedPayload,
  UpdateMatchPayload,
} from '@/lib/socket'

/**
 * Global socket hook for WebSocket connection management.
 *
 * Provides:
 * - Automatic connection with auth token
 * - Reconnection handling
 * - Match-related actions (join, leave, getMatch, etc.)
 * - Event listener factories
 *
 * @example
 * ```tsx
 * const { socket, connected, joinMatch, getMatch } = useSocket()
 *
 * useEffect(() => {
 *   if (connected) {
 *     getMatch(matchId)
 *     socket.on('match-data', handleMatchData)
 *   }
 * }, [connected])
 * ```
 */
export const useSocket = () => {
  const {
    socket,
    connected,
    error,
    isConnecting,
    setSocket,
    setConnected,
    setError,
    setIsConnecting,
    reset,
  } = useSocketStore()

  // Initialize socket connection
  useEffect(() => {
    // If socket exists and is connected, nothing to do
    if (socket?.connected) {
      if (!connected) {
        setConnected(true)
      }
      return
    }

    // If socket exists but disconnected, try to reconnect
    if (socket && !socket.connected) {
      socket.connect()
      return
    }

    // If already connecting, wait
    if (isConnecting) return

    const initSocket = async () => {
      setIsConnecting(true)
      setError(null)

      try {
        const session = await authClient.getSession()

        if (!session?.data?.session?.token) {
          setError('No session token available')
          setIsConnecting(false)
          return
        }

        const token = session.data.session.token
        const serverUrl = getSocketServerUrl()

        const newSocket = io(serverUrl, {
          auth: { authorization: token, token },
          extraHeaders: { Authorization: token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          withCredentials: true,
        })

        // Connection events
        newSocket.on('connect', () => {
          setError(null)
        })

        newSocket.on('connect_error', (err) => {
          setError(`Connection error: ${err.message}`)
          setIsConnecting(false)
        })

        newSocket.on('disconnect', () => {
          setConnected(false)
        })

        newSocket.on('reconnect_failed', () => {
          setError('Failed to reconnect to server')
        })

        newSocket.on(SOCKET_EVENTS.CONNECT_SUCCESS, () => {
          setConnected(true)
          setError(null)
          setIsConnecting(false)
        })

        newSocket.on(SOCKET_EVENTS.ERROR, (data) => {
          setError(data.message || 'Socket error occurred')
        })

        setSocket(newSocket)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setIsConnecting(false)
      }
    }

    initSocket()
  }, [
    socket,
    connected,
    isConnecting,
    setSocket,
    setConnected,
    setError,
    setIsConnecting,
  ])

  // Note: We intentionally do NOT close the socket on component unmount
  // The socket connection should persist across page navigations in the SPA
  // Socket will be closed when the browser tab is closed or on logout

  // Emit helpers
  const emit = useCallback(
    (event: string, data: unknown) => {
      if (!socket || !connected) {
        console.warn(`[Socket] Cannot emit ${event} - not connected`)
        return false
      }
      socket.emit(event, data)
      return true
    },
    [socket, connected]
  )

  // Actions
  const joinMatch = useCallback(
    (matchId: string) =>
      emit(SOCKET_EVENTS.JOIN_MATCH, { matchId } as JoinMatchPayload),
    [emit]
  )

  const leaveMatch = useCallback(
    (matchId: string) =>
      emit(SOCKET_EVENTS.LEAVE_MATCH, { matchId } as LeaveMatchPayload),
    [emit]
  )

  const getMatch = useCallback(
    (matchId: string) =>
      emit(SOCKET_EVENTS.GET_MATCH, { matchId } as GetMatchPayload),
    [emit]
  )

  const createSet = useCallback(
    async (matchId: string, setNumber?: number) => {
      if (
        !emit(SOCKET_EVENTS.CREATE_SET, {
          matchId,
          setNumber,
        } as CreateSetPayload)
      ) {
        throw new Error('Socket not connected')
      }
    },
    [emit]
  )

  const updateSetScore = useCallback(
    async (
      setId: string,
      registration1Score: number,
      registration2Score: number,
      played?: boolean
    ) => {
      const payload: UpdateSetScorePayload = {
        setId,
        registration1Score,
        registration2Score,
        played,
      }
      if (!emit(SOCKET_EVENTS.UPDATE_SET_SCORE, payload)) {
        throw new Error('Socket not connected')
      }
    },
    [emit]
  )

  const markSetPlayed = useCallback(
    async (setId: string) => {
      if (
        !emit(SOCKET_EVENTS.MARK_SET_PLAYED, { setId } as MarkSetPlayedPayload)
      ) {
        throw new Error('Socket not connected')
      }
    },
    [emit]
  )

  const updateMatch = useCallback(
    async (matchId: string, data: { played?: boolean; matchDate?: string }) => {
      const payload: UpdateMatchPayload = { matchId, ...data }
      if (!emit(SOCKET_EVENTS.UPDATE_MATCH, payload)) {
        throw new Error('Socket not connected')
      }
    },
    [emit]
  )

  // Event listeners
  const createListener = useCallback(
    (event: string) => (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(event, callback)
      return () => {
        socket.off(event, callback)
      }
    },
    [socket]
  )

  return {
    socket,
    connected,
    error,
    isConnecting,
    // Actions
    joinMatch,
    leaveMatch,
    getMatch,
    createSet,
    updateSetScore,
    markSetPlayed,
    updateMatch,
    // Listeners
    onMatchData: createListener(SOCKET_EVENTS.MATCH_DATA),
    onSetCreated: createListener(SOCKET_EVENTS.SET_CREATED),
    onScoreUpdated: createListener(SOCKET_EVENTS.MATCH_SCORE_UPDATED),
    onSetPlayed: createListener(SOCKET_EVENTS.SET_PLAYED),
    onMatchCompleted: createListener(SOCKET_EVENTS.MATCH_COMPLETED),
    onMatchUpdated: createListener(SOCKET_EVENTS.MATCH_UPDATED),
    onError: createListener(SOCKET_EVENTS.ERROR),
  }
}
