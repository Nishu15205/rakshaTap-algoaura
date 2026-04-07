import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const PORT = 3003
const JWT_SECRET = process.env.JWT_SECRET || 'mumaa-super-secret-key-change-in-production-2024'

function verifyJwt(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

const io = new Server(PORT, {
  path: '/',
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST'],
  },
})

// Store connected users
const onlineUsers = new Map<string, { socketId: string; userId: string; role: string; name: string }>()

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`)

  // Auth timeout — disconnect if not authenticated within 10s
  const authTimeout = setTimeout(() => {
    if (!socket.data.user) {
      console.log(`[Socket] Auth timeout: ${socket.id}`)
      socket.disconnect(true)
    }
  }, 10000)

  // --- AUTH EVENT ---
  socket.on('auth', (data: { token: string }, callback?: (response: { success: boolean; error?: string }) => void) => {
    clearTimeout(authTimeout)

    if (!data || !data.token) {
      const msg = 'Token is required for authentication'
      console.log(`[Auth] Failed (${socket.id}): ${msg}`)
      if (callback) callback({ success: false, error: msg })
      socket.disconnect(true)
      return
    }

    const user = verifyJwt(data.token)

    if (!user) {
      const msg = 'Invalid or expired token'
      console.log(`[Auth] Failed (${socket.id}): ${msg}`)
      if (callback) callback({ success: false, error: msg })
      socket.disconnect(true)
      return
    }

    socket.data.user = user
    console.log(`[Auth] Success (${socket.id}): ${user.email} (${user.role})`)

    if (callback) callback({ success: true })
  })

  // User comes online
  socket.on('user:online', (data: { userId: string; role: string; name: string }) => {
    if (!socket.data.user) return
    onlineUsers.set(data.userId, { socketId: socket.id, ...data })
    io.emit('users:online:update', Array.from(onlineUsers.values()))
    console.log(`[Socket] User online: ${data.name} (${data.userId})`)
  })

  // User goes offline
  socket.on('user:offline', (data: { userId: string }) => {
    if (!socket.data.user) return
    onlineUsers.delete(data.userId)
    io.emit('users:online:update', Array.from(onlineUsers.values()))
    console.log(`[Socket] User offline: ${data.userId}`)
  })

  // Send notification to specific user
  socket.on('notification:send', (data: { userId: string; notification: { title: string; message: string; type: string } }) => {
    if (!socket.data.user) return
    const targetUser = onlineUsers.get(data.userId)
    if (targetUser) {
      io.to(targetUser.socketId).emit('notification:new', data.notification)
      console.log(`[Socket] Notification sent to ${data.userId}`)
    }
  })

  // Get online users list
  socket.on('users:online:list', () => {
    if (!socket.data.user) return
    socket.emit('users:online:update', Array.from(onlineUsers.values()))
  })

  // Call request (nanny side)
  socket.on('call:request', (data: { nannyId: string; fromUser: { name: string; userId: string } }) => {
    if (!socket.data.user) return
    const targetNanny = onlineUsers.get(data.nannyId)
    if (targetNanny) {
      io.to(targetNanny.socketId).emit('call:incoming', data)
      console.log(`[Socket] Call request from ${data.fromUser.name} to nanny ${data.nannyId}`)
    }
  })

  // Call accepted
  socket.on('call:accepted', (data: { parentId: string }) => {
    if (!socket.data.user) return
    const targetParent = onlineUsers.get(data.parentId)
    if (targetParent) {
      io.to(targetParent.socketId).emit('call:accepted', {})
    }
  })

  // ─── WebRTC Signaling ───
  const callRooms = new Map<string, string[]>()

  socket.on('call:join-room', (data: { roomId: string; userId: string; userName?: string }) => {
    if (!socket.data.user) return
    socket.join(data.roomId)
    if (!callRooms.has(data.roomId)) {
      callRooms.set(data.roomId, [])
    }
    const room = callRooms.get(data.roomId)!
    room.push(data.userId)

    // Notify room members (NOT to self)
    socket.to(data.roomId).emit('call:peer-joined', {
      userId: data.userId,
      userName: data.userName || data.userId,
      roomId: data.roomId,
      roomSize: room.length,
    })

    // If others already in room, tell the joiner to create offer
    const existing = room.filter(id => id !== data.userId)
    if (existing.length > 0) {
      socket.emit('call:create-offer', { peerId: existing[0], roomId: data.roomId })
    }

    console.log(`[Socket] ${data.userName || data.userId} joined room ${data.roomId}, members: ${room.length}`)
  })

  socket.on('call:leave-room', (data: { roomId: string; userId: string; userName?: string }) => {
    if (!socket.data.user) return
    socket.leave(data.roomId)
    if (callRooms.has(data.roomId)) {
      const room = callRooms.get(data.roomId)!.filter(id => id !== data.userId)
      if (room.length === 0) {
        callRooms.delete(data.roomId)
      }
      socket.to(data.roomId).emit('call:peer-left', {
        userId: data.userId,
        userName: data.userName || data.userId,
        roomId: data.roomId,
      })
    }
    console.log(`[Socket] ${data.userName || data.userId} left room ${data.roomId}`)
  })

  // Relay WebRTC signals between peers (NOT to self)
  socket.on('call:signal', (data: { roomId: string; signal: any; to?: string; userId?: string }) => {
    if (!socket.data.user) return
    // Look up userId from onlineUsers if not provided
    let fromUserId = data.userId || 'unknown'
    if (!data.userId) {
      for (const [uid, user] of onlineUsers.entries()) {
        if (user.socketId === socket.id) {
          fromUserId = uid
          break
        }
      }
    }
    socket.to(data.roomId).emit('call:signal', {
      from: fromUserId,
      signal: data.signal,
      roomId: data.roomId,
    })
    console.log(`[Socket] Signal relayed in room ${data.roomId} from ${fromUserId}`)
  })

  // Disconnect
  socket.on('disconnect', () => {
    clearTimeout(authTimeout)
    // Remove user from online list
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.socketId === socket.id) {
        onlineUsers.delete(userId)
        io.emit('users:online:update', Array.from(onlineUsers.values()))
        console.log(`[Socket] User disconnected: ${userId}`)
        break
      }
    }
  })
})

console.log(`[Socket.IO] Real-time service running on port ${PORT}`)
