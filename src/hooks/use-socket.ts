'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { authClient } from '@/lib/auth-client'

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'

// Socket event names (matching backend)
const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_MATCH: 'join-match',
  LEAVE_MATCH: 'leave-match',
  GET_MATCH: 'get-match',
  UPDATE_SET_SCORE: 'update-set-score',
  UPDATE_MATCH: 'update-match',
  CREATE_SET: 'create-set',
  MARK_SET_PLAYED: 'mark-set-played',
  // Server -> Client
  MATCH_DATA: 'match-data',
  MATCH_SCORE_UPDATED: 'match-score-updated',
  MATCH_UPDATED: 'match-updated',
  SET_COMPLETED: 'set-completed',
  MATCH_COMPLETED: 'match-completed',
  SET_CREATED: 'set-created',
  SET_PLAYED: 'set-played',
  ERROR: 'err',
  CONNECT_SUCCESS: 'connect-success',
} as const

interface UseSocketReturn {
  socket: Socket | null
  connected: boolean
  error: string | null
  joinMatch: (matchId: string) => void
  leaveMatch: (matchId: string) => void
  getMatch: (matchId: string) => void
  createSet: (matchId: string, setNumber?: number) => Promise<void>
  updateSetScore: (
    setId: string,
    registration1Score: number,
    registration2Score: number,
    played?: boolean
  ) => Promise<void>
  markSetPlayed: (setId: string) => Promise<void>
  updateMatch: (
    matchId: string,
    data: { played?: boolean; matchDate?: string }
  ) => Promise<void>
  onMatchData: (callback: (data: any) => void) => (() => void) | undefined
  onSetCreated: (callback: (data: any) => void) => (() => void) | undefined
  onScoreUpdated: (callback: (data: any) => void) => (() => void) | undefined
  onSetCompleted: (callback: (data: any) => void) => (() => void) | undefined
  onSetPlayed: (callback: (data: any) => void) => (() => void) | undefined
  onMatchCompleted: (callback: (data: any) => void) => (() => void) | undefined
  onMatchUpdated: (callback: (data: any) => void) => (() => void) | undefined
  onError: (callback: (error: string) => void) => (() => void) | undefined
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const initSocket = async () => {
      console.log('[Socket] Initializing socket connection...')
      console.log('[Socket] Server URL:', SOCKET_SERVER_URL)

      try {
        // Get session from better-auth
        console.log('[Socket] Fetching session from better-auth...')
        const session = await authClient.getSession()

        if (!session?.data?.session?.token) {
          console.error('[Socket] No session token available')
          console.log('[Socket] Session data:', session?.data)
          setError('No session token available')
          return
        }

        const token = session.data.session.token
        console.log('[Socket] Token obtained, length:', token.length)

        // Create socket connection with auth token
        console.log('[Socket] Creating socket connection...')
        const newSocket = io(SOCKET_SERVER_URL, {
          auth: {
            authorization: token,
            token: token,
          },
          extraHeaders: {
            Authorization: token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          withCredentials: true,
        })

        newSocket.on('connect', () => {
          console.log('[Socket] Connected - Socket ID:', newSocket.id)
          // Don't set connected here - wait for connect-success from server
          // This ensures server has finished authentication and registered event listeners
          setError(null)
        })

        newSocket.on('connect_error', (err) => {
          console.error('[Socket] Connect error:', err.message)
          console.error('[Socket] Connect error details:', err)
          setError(`Connection error: ${err.message}`)
        })

        newSocket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected - Reason:', reason)
          setConnected(false)
        })

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('[Socket] Reconnected after', attemptNumber, 'attempts')
        })

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          console.log('[Socket] Reconnection attempt #', attemptNumber)
        })

        newSocket.on('reconnect_error', (err) => {
          console.error('[Socket] Reconnect error:', err)
        })

        newSocket.on('reconnect_failed', () => {
          console.error('[Socket] Reconnection failed after all attempts')
          setError('Failed to reconnect to server')
        })

        newSocket.on(SOCKET_EVENTS.CONNECT_SUCCESS, (data) => {
          console.log('[Socket] Connection success from server:', data)
          setConnected(true)
          setError(null)
        })

        newSocket.on(SOCKET_EVENTS.ERROR, (data) => {
          console.error('[Socket] Server error:', data)
          setError(data.message || 'Socket error occurred')
        })

        socketRef.current = newSocket
        setSocket(newSocket)
        console.log('[Socket] Socket instance created and stored')

        return () => {
          console.log('[Socket] Cleaning up socket connection')
          newSocket.close()
          socketRef.current = null
        }
      } catch (err) {
        console.error('[Socket] Failed to initialize socket:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect')
      }
    }

    initSocket()
  }, [])

  const joinMatch = useCallback(
    (matchId: string) => {
      console.log('[Socket] joinMatch called:', {
        matchId,
        connected,
        hasSocket: !!socket,
      })
      if (socket && connected) {
        socket.emit(SOCKET_EVENTS.JOIN_MATCH, { matchId })
        console.log('[Socket] Emitted JOIN_MATCH for:', matchId)
      } else {
        console.warn('[Socket] Cannot join match - not connected')
      }
    },
    [socket, connected]
  )

  const leaveMatch = useCallback(
    (matchId: string) => {
      console.log('[Socket] leaveMatch called:', {
        matchId,
        connected,
        hasSocket: !!socket,
      })
      if (socket && connected) {
        socket.emit(SOCKET_EVENTS.LEAVE_MATCH, { matchId })
        console.log('[Socket] Emitted LEAVE_MATCH for:', matchId)
      }
    },
    [socket, connected]
  )

  const getMatch = useCallback(
    (matchId: string) => {
      console.log('[Socket] getMatch called:', {
        matchId,
        connected,
        hasSocket: !!socket,
      })
      if (socket && connected) {
        socket.emit(SOCKET_EVENTS.GET_MATCH, { matchId })
        console.log('[Socket] Emitted GET_MATCH for:', matchId)
      } else {
        console.warn('[Socket] Cannot get match - not connected')
      }
    },
    [socket, connected]
  )

  const createSet = useCallback(
    async (matchId: string, setNumber?: number) => {
      console.log('[Socket] createSet called:', {
        matchId,
        setNumber,
        connected,
        hasSocket: !!socket,
      })
      if (!socket || !connected) {
        console.error('[Socket] Cannot create set - not connected')
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.CREATE_SET, { matchId, setNumber })
      console.log('[Socket] Emitted CREATE_SET:', { matchId, setNumber })
    },
    [socket, connected]
  )

  const updateSetScore = useCallback(
    async (
      setId: string,
      registration1Score: number,
      registration2Score: number,
      played?: boolean
    ) => {
      console.log('[Socket] updateSetScore called:', {
        setId,
        registration1Score,
        registration2Score,
        played,
      })
      if (!socket || !connected) {
        console.error('[Socket] Cannot update score - not connected')
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.UPDATE_SET_SCORE, {
        setId,
        registration1Score,
        registration2Score,
        played,
      })
      console.log('[Socket] Emitted UPDATE_SET_SCORE')
    },
    [socket, connected]
  )

  const markSetPlayed = useCallback(
    async (setId: string) => {
      console.log('[Socket] markSetPlayed called:', { setId })
      if (!socket || !connected) {
        console.error('[Socket] Cannot mark set played - not connected')
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.MARK_SET_PLAYED, { setId })
      console.log('[Socket] Emitted MARK_SET_PLAYED')
    },
    [socket, connected]
  )

  const updateMatch = useCallback(
    async (matchId: string, data: { played?: boolean; matchDate?: string }) => {
      console.log('[Socket] updateMatch called:', {
        matchId,
        data,
        connected,
        hasSocket: !!socket,
      })
      if (!socket || !connected) {
        console.error('[Socket] Cannot update match - not connected')
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.UPDATE_MATCH, {
        matchId,
        ...data,
      })
      console.log('[Socket] Emitted UPDATE_MATCH')
    },
    [socket, connected]
  )

  const onMatchData = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.MATCH_DATA, callback)
      return () => {
        socket.off(SOCKET_EVENTS.MATCH_DATA, callback)
      }
    },
    [socket]
  )

  const onSetCreated = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.SET_CREATED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.SET_CREATED, callback)
      }
    },
    [socket]
  )

  const onScoreUpdated = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.MATCH_SCORE_UPDATED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.MATCH_SCORE_UPDATED, callback)
      }
    },
    [socket]
  )

  const onSetCompleted = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.SET_COMPLETED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.SET_COMPLETED, callback)
      }
    },
    [socket]
  )

  const onSetPlayed = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.SET_PLAYED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.SET_PLAYED, callback)
      }
    },
    [socket]
  )

  const onMatchCompleted = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.MATCH_COMPLETED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.MATCH_COMPLETED, callback)
      }
    },
    [socket]
  )

  const onMatchUpdated = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return
      socket.on(SOCKET_EVENTS.MATCH_UPDATED, callback)
      return () => {
        socket.off(SOCKET_EVENTS.MATCH_UPDATED, callback)
      }
    },
    [socket]
  )

  const onError = useCallback(
    (callback: (error: string) => void) => {
      if (!socket) return
      const errorHandler = (data: any) => {
        callback(data.message || 'Socket error')
      }
      socket.on(SOCKET_EVENTS.ERROR, errorHandler)
      return () => {
        socket.off(SOCKET_EVENTS.ERROR, errorHandler)
      }
    },
    [socket]
  )

  return {
    socket,
    connected,
    error,
    joinMatch,
    leaveMatch,
    getMatch,
    createSet,
    updateSetScore,
    markSetPlayed,
    updateMatch,
    onMatchData,
    onSetCreated,
    onScoreUpdated,
    onSetCompleted,
    onSetPlayed,
    onMatchCompleted,
    onMatchUpdated,
    onError,
  }
}
