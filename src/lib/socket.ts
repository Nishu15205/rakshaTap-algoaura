'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(userId: string, role: string, name: string): Socket {
  if (socket?.connected) return socket

  socket = io('/?XTransformPort=3003', {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected')
    socket!.emit('user:online', { userId, role, name })
  })

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected')
  })

  return socket
}

export function disconnectSocket(userId?: string) {
  if (socket) {
    if (userId) {
      socket.emit('user:offline', { userId })
    }
    socket.disconnect()
    socket = null
  }
}

export function onNotification(callback: (data: { title: string; message: string; type: string }) => void) {
  if (socket) {
    socket.on('notification:new', callback)
  }
}

export function onOnlineUsersUpdate(callback: (users: Array<{ userId: string; role: string; name: string }>) => void) {
  if (socket) {
    socket.on('users:online:update', callback)
  }
}

export function requestOnlineUsers() {
  if (socket) {
    socket.emit('users:online:list')
  }
}

export function sendNotification(userId: string, notification: { title: string; message: string; type: string }) {
  if (socket) {
    socket.emit('notification:send', { userId, notification })
  }
}

// ─── WebRTC Signaling Helpers ───

export function onCallSignal(callback: (data: { from: string; signal: any; roomId: string }) => void): () => void {
  if (!socket) return () => {}
  const handler = (data: { from: string; signal: any; roomId: string }) => callback(data)
  socket.on('call:signal', handler)
  return () => { socket?.off('call:signal', handler) }
}

export function sendCallSignal(to: string, signal: any, roomId: string): void {
  if (socket) {
    socket.emit('call:signal', { roomId, signal, to })
  }
}

export function onCallJoined(callback: (data: { userId: string; userName: string; roomId: string }) => void): () => void {
  if (!socket) return () => {}
  const handler = (data: { userId: string; userName: string; roomId: string }) => callback(data)
  socket.on('call:peer-joined', handler)
  return () => { socket?.off('call:peer-joined', handler) }
}

export function onCallLeft(callback: (data: { userId: string; roomId: string }) => void): () => void {
  if (!socket) return () => {}
  const handler = (data: { userId: string; roomId: string }) => callback(data)
  socket.on('call:peer-left', handler)
  return () => { socket?.off('call:peer-left', handler) }
}
