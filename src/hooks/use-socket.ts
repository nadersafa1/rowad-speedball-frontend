'use client'

import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
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
 * Error messages used throughout the socket hook
 */
const ERROR_MESSAGES = {
  NO_SESSION: 'No session token available',
  CONNECTION_ERROR: (msg: string) => `Connection error: ${msg}`,
  RECONNECT_FAILED: 'Failed to reconnect to server',
  SOCKET_ERROR: (msg: string) => msg || 'Socket error occurred',
  NOT_CONNECTED: 'Socket not connected',
  EMIT_WARNING: (event: string) =>
    `[Socket] Cannot emit ${event} - not connected`,
  GENERIC_ERROR: 'Failed to connect',
} as const

/**
 * Connection status enum for better state management
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Type for socket event callbacks
 */
type SocketEventCallback<T = unknown> = (data: T) => void

/**
 * Fetches the session token from the auth client
 * @returns The session token or null if not available
 */
const fetchSessionToken = async (): Promise<string | null> => {
  const session = await authClient.getSession()
  return session?.data?.session?.token || null
}

/**
 * Creates a new Socket.IO instance with the given configuration
 * @param serverUrl - The Socket.IO server URL
 * @param token - The authentication token
 * @returns Configured Socket.IO instance
 */
const createSocketInstance = (serverUrl: string, token: string): Socket => {
  return io(serverUrl, {
    auth: { authorization: token, token },
    extraHeaders: { Authorization: token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    withCredentials: true,
  })
}

/**
 * Checks if an error is authentication-related
 * @param error - The error to check
 * @returns True if the error is auth-related
 */
const isAuthError = (error: Error): boolean => {
  const message = error.message.toLowerCase()
  return (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('401')
  )
}

/**
 * Callbacks for socket event handlers
 */
interface SocketEventHandlers {
  onConnect: () => void
  onConnectError: (err: Error) => void
  onDisconnect: () => void
  onReconnectFailed: () => void
  onConnectSuccess: () => void
  onError: (data: { message?: string }) => void
}

/**
 * Sets up all socket event handlers
 * @param socket - The socket instance to attach handlers to
 * @param handlers - Object containing all event handler callbacks
 */
const setupSocketEventHandlers = (
  socket: Socket,
  handlers: SocketEventHandlers
): void => {
  socket.on('connect', handlers.onConnect)
  socket.on('connect_error', handlers.onConnectError)
  socket.on('disconnect', handlers.onDisconnect)
  socket.on('reconnect_failed', handlers.onReconnectFailed)
  socket.on(SOCKET_EVENTS.CONNECT_SUCCESS, handlers.onConnectSuccess)
  socket.on(SOCKET_EVENTS.ERROR, handlers.onError)
}

/**
 * Connection state machine:
 * 1. Initial: socket=null, connected=false, isConnecting=false
 * 2. Connecting: socket=null, connected=false, isConnecting=true
 * 3. Connected: socket=Socket, connected=true, isConnecting=false
 * 4. Disconnected: socket=Socket, connected=false, isConnecting=false
 * 5. Error: socket may exist, connected=false, error is set
 *
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

  // Track if initialization has been attempted (prevents re-runs)
  const initAttemptedRef = useRef(false)
  // Cache session token to avoid repeated API calls
  const sessionTokenRef = useRef<string | null>(null)

  /**
   * Resets connection state and clears cached values
   */
  const resetConnectionState = useCallback(() => {
    sessionTokenRef.current = null
    initAttemptedRef.current = false
  }, [])

  /**
   * Gets the current connection status
   */
  const getConnectionStatus = useCallback((): ConnectionStatus => {
    if (error) return ConnectionStatus.ERROR
    if (isConnecting) return ConnectionStatus.CONNECTING
    if (connected) return ConnectionStatus.CONNECTED
    return ConnectionStatus.DISCONNECTED
  }, [error, isConnecting, connected])

  // Initialize socket connection
  useEffect(() => {
    // Early return: socket exists and is connected
    if (socket?.connected) {
      if (!connected) {
        setConnected(true)
      }
      return
    }

    // Early return: socket exists but disconnected, just reconnect (no new session needed)
    if (socket && !socket.connected) {
      socket.connect()
      return
    }

    // Early return: already connecting
    if (isConnecting) return

    // Early return: already attempted initialization and no socket exists
    // This prevents infinite loops when initialization fails
    if (initAttemptedRef.current && !socket) {
      return
    }

    const initSocket = async () => {
      // Mark as attempted BEFORE any async operations
      initAttemptedRef.current = true
      setIsConnecting(true)
      setError(null)

      try {
        // Only fetch session if we don't have a cached token
        let token = sessionTokenRef.current
        if (!token) {
          token = await fetchSessionToken()
          if (!token) {
            setError(ERROR_MESSAGES.NO_SESSION)
            setIsConnecting(false)
            resetConnectionState()
            return
          }
          sessionTokenRef.current = token
        }

        const serverUrl = getSocketServerUrl()
        const newSocket = createSocketInstance(serverUrl, token)

        // Setup all event handlers
        setupSocketEventHandlers(newSocket, {
          onConnect: () => {
            setError(null)
          },
          onConnectError: (err) => {
            setError(ERROR_MESSAGES.CONNECTION_ERROR(err.message))
            setIsConnecting(false)
            // Clear token cache on auth errors to force re-fetch
            if (isAuthError(err)) {
              resetConnectionState()
            }
          },
          onDisconnect: () => {
            setConnected(false)
          },
          onReconnectFailed: () => {
            setError(ERROR_MESSAGES.RECONNECT_FAILED)
          },
          onConnectSuccess: () => {
            setConnected(true)
            setError(null)
            setIsConnecting(false)
          },
          onError: (data) => {
            setError(ERROR_MESSAGES.SOCKET_ERROR(data.message || ''))
          },
        })

        setSocket(newSocket)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC_ERROR
        )
        setIsConnecting(false)
        resetConnectionState()
      }
    }

    initSocket()
    // Reduced dependencies - only essential state values
    // Removed setters as they're stable from Zustand
  }, [socket, connected, isConnecting]) // Removed setters from deps

  // Note: We intentionally do NOT close the socket on component unmount
  // The socket connection should persist across page navigations in the SPA
  // Socket will be closed when the browser tab is closed or on logout

  // Emit helpers
  const emit = useCallback(
    (event: string, data: unknown) => {
      if (!socket || !connected) {
        console.warn(ERROR_MESSAGES.EMIT_WARNING(event))
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
        throw new Error(ERROR_MESSAGES.NOT_CONNECTED)
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
        throw new Error(ERROR_MESSAGES.NOT_CONNECTED)
      }
    },
    [emit]
  )

  const markSetPlayed = useCallback(
    async (setId: string) => {
      if (
        !emit(SOCKET_EVENTS.MARK_SET_PLAYED, { setId } as MarkSetPlayedPayload)
      ) {
        throw new Error(ERROR_MESSAGES.NOT_CONNECTED)
      }
    },
    [emit]
  )

  const updateMatch = useCallback(
    async (matchId: string, data: { played?: boolean; matchDate?: string }) => {
      const payload: UpdateMatchPayload = { matchId, ...data }
      if (!emit(SOCKET_EVENTS.UPDATE_MATCH, payload)) {
        throw new Error(ERROR_MESSAGES.NOT_CONNECTED)
      }
    },
    [emit]
  )

  // Event listeners with proper typing
  const createListener = useCallback(
    <T = unknown>(event: string) =>
      (callback: SocketEventCallback<T>) => {
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
    connectionStatus: getConnectionStatus(),
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
