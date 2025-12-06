// Socket Store - Single responsibility: Socket connection state management
import { create } from 'zustand'
import { Socket } from 'socket.io-client'

interface SocketState {
  socket: Socket | null
  connected: boolean
  error: string | null
  isConnecting: boolean

  // Actions
  setSocket: (socket: Socket | null) => void
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  setIsConnecting: (isConnecting: boolean) => void
  reset: () => void
}

const initialState = {
  socket: null,
  connected: false,
  error: null,
  isConnecting: false,
}

export const useSocketStore = create<SocketState>((set) => ({
  ...initialState,

  setSocket: (socket) => set({ socket }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  setIsConnecting: (isConnecting) => set({ isConnecting }),

  reset: () => set(initialState),
}))

