'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { authClient } from '@/lib/auth-client'

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'

// Socket event names (matching backend)
const SOCKET_EVENTS = {
  JOIN_MATCH: 'join-match',
  LEAVE_MATCH: 'leave-match',
  UPDATE_SET_SCORE: 'update-set-score',
  UPDATE_MATCH: 'update-match',
  CREATE_SET: 'create-set',
  MATCH_SCORE_UPDATED: 'match-score-updated',
  MATCH_UPDATED: 'match-updated',
  SET_COMPLETED: 'set-completed',
  MATCH_COMPLETED: 'match-completed',
  SET_CREATED: 'set-created',
  ERROR: 'err',
  CONNECT_SUCCESS: 'connect-success',
} as const

interface UseSocketReturn {
  socket: Socket | null
  connected: boolean
  error: string | null
  joinMatch: (matchId: string) => void
  leaveMatch: (matchId: string) => void
  createSet: (matchId: string, setNumber?: number) => Promise<void>
  updateSetScore: (
    setId: string,
    registration1Score: number,
    registration2Score: number,
    played?: boolean
  ) => Promise<void>
  updateMatch: (
    matchId: string,
    data: { played?: boolean; matchDate?: string }
  ) => Promise<void>
  onSetCreated: (callback: (data: any) => void) => (() => void) | undefined
  onScoreUpdated: (callback: (data: any) => void) => (() => void) | undefined
  onSetCompleted: (callback: (data: any) => void) => (() => void) | undefined
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
      try {
        // Get session from better-auth
        const session = await authClient.getSession()
        if (!session?.data?.session?.token) {
          setError('No session token available')
          return
        }

        const token = session.data.session.token

        // Create socket connection with auth token
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
          console.log('Socket connected')
          setConnected(true)
          setError(null)
        })

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected')
          setConnected(false)
        })

        newSocket.on(SOCKET_EVENTS.CONNECT_SUCCESS, (data) => {
          console.log('Socket connection success:', data)
          setConnected(true)
        })

        newSocket.on(SOCKET_EVENTS.ERROR, (data) => {
          console.error('Socket error:', data)
          setError(data.message || 'Socket error occurred')
        })

        socketRef.current = newSocket
        setSocket(newSocket)

        return () => {
          newSocket.close()
          socketRef.current = null
        }
      } catch (err) {
        console.error('Failed to initialize socket:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect')
      }
    }

    initSocket()
  }, [])

  const joinMatch = useCallback(
    (matchId: string) => {
      if (socket && connected) {
        socket.emit(SOCKET_EVENTS.JOIN_MATCH, { matchId })
      }
    },
    [socket, connected]
  )

  const leaveMatch = useCallback(
    (matchId: string) => {
      if (socket && connected) {
        socket.emit(SOCKET_EVENTS.LEAVE_MATCH, { matchId })
      }
    },
    [socket, connected]
  )

  const createSet = useCallback(
    async (matchId: string, setNumber?: number) => {
      if (!socket || !connected) {
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.CREATE_SET, { matchId, setNumber })
      console.log('createSet', matchId, setNumber)
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
      if (!socket || !connected) {
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.UPDATE_SET_SCORE, {
        setId,
        registration1Score,
        registration2Score,
        played,
      })
    },
    [socket, connected]
  )

  const updateMatch = useCallback(
    async (matchId: string, data: { played?: boolean; matchDate?: string }) => {
      if (!socket || !connected) {
        throw new Error('Socket not connected')
      }

      socket.emit(SOCKET_EVENTS.UPDATE_MATCH, {
        matchId,
        ...data,
      })
    },
    [socket, connected]
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
    createSet,
    updateSetScore,
    updateMatch,
    onSetCreated,
    onScoreUpdated,
    onSetCompleted,
    onMatchCompleted,
    onMatchUpdated,
    onError,
  }
}
