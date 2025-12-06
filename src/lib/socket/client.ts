'use client'

import { io, Socket } from 'socket.io-client'
import { authClient } from '@/lib/auth-client'

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'

// Singleton socket instance
let socketInstance: Socket | null = null
let connectionPromise: Promise<Socket> | null = null

export const getSocketServerUrl = () => SOCKET_SERVER_URL

/**
 * Get or create the socket connection
 * Returns a promise that resolves when connected
 */
export const getSocket = async (): Promise<Socket> => {
  // Return existing connection if available
  if (socketInstance?.connected) {
    return socketInstance
  }

  // Return pending connection promise if one exists
  if (connectionPromise) {
    return connectionPromise
  }

  // Create new connection
  connectionPromise = createSocket()
  return connectionPromise
}

/**
 * Create a new socket connection
 */
const createSocket = async (): Promise<Socket> => {
  const session = await authClient.getSession()

  if (!session?.data?.session?.token) {
    throw new Error('No session token available')
  }

  const token = session.data.session.token

  const socket = io(SOCKET_SERVER_URL, {
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

  socketInstance = socket
  return socket
}

/**
 * Get the current socket instance (may be null)
 */
export const getCurrentSocket = (): Socket | null => socketInstance

/**
 * Disconnect and cleanup socket
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.close()
    socketInstance = null
    connectionPromise = null
  }
}

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socketInstance?.connected ?? false
}
