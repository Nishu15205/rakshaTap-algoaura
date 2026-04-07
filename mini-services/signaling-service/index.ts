import { createServer } from 'http'
import { Server } from 'socket.io'

// Types
interface AuthPayload {
  token: string
}

interface VerifiedUser {
  userId: string
  role: string
  email: string
  name?: string | null
}

interface JoinRoomPayload {
  roomId: string
  userId: string
  role: string
}

interface LeaveRoomPayload {
  roomId: string
}

interface SignalPayload {
  roomId: string
  targetUserId?: string
  signal?: unknown
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

interface ChatMessagePayload {
  roomId: string
  message: string
}

// Track authenticated users per socket
const socketUsers = new Map<string, VerifiedUser>()
// Track which rooms each socket is in
const socketRooms = new Map<string, string[]>()

// Verify token by calling the Next.js API
async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const response = await fetch(
      `http://localhost:3000/api/auth/verify?token=${encodeURIComponent(token)}`
    )
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    if (data.success && data.data) {
      return data.data as VerifiedUser
    }
    return null
  } catch (error) {
    console.error('[Auth] Token verification failed:', error)
    return null
  }
}

// Build ICE servers config
function getIceServers(): Array<{
  urls: string
  username?: string
  credential?: string
}> {
  const servers: Array<{ urls: string; username?: string; credential?: string }> = [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // Metered.ca STUN servers
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:stun.relay.metered.ca:443' },

    // Metered.ca TURN servers (credentials from env vars)
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:b.relay.metered.ca:80',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:b.relay.metered.ca:443',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:b.relay.metered.ca:443?transport=tcp',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
  ]

  // Add TURN server if env vars are configured (overrides above)
  const turnUrl = process.env.TURN_SERVER_URL
  const turnUsername = process.env.TURN_SERVER_USERNAME
  const turnCredential = process.env.TURN_SERVER_CREDENTIAL

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    })
    console.log(`[TURN] Additional TURN server from env: ${turnUrl}`)
  }

  console.log(`[ICE] ${servers.length} ICE servers configured (2 STUN + 6 Google STUN + 7 Metered.ca)`)
  return servers
}

// Helper: find a socket by userId in a specific room
function findSocketByUserId(
  userId: string,
  roomId: string
): string | null {
  for (const [socketId, user] of socketUsers.entries()) {
    if (user.userId === userId) {
      const rooms = socketRooms.get(socketId) || []
      if (rooms.includes(roomId)) {
        return socketId
      }
    }
  }
  return null
}

// Create HTTP server
const PORT = 3004
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'signaling',
        uptime: process.uptime(),
      })
    )
    return
  }
  res.writeHead(404)
  res.end('Not Found')
})

// Create Socket.IO server attached to HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  path: '/',
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  // Authentication timeout — disconnect if not authenticated within 10s
  const authTimeout = setTimeout(() => {
    if (!socketUsers.has(socket.id)) {
      console.log(`[Socket] Auth timeout: ${socket.id}`)
      socket.disconnect(true)
    }
  }, 10000)

  // --- AUTH EVENT ---
  socket.on(
    'auth',
    async (
      payload: AuthPayload,
      callback?: (response: {
        success: boolean
        error?: string
        user?: VerifiedUser
      }) => void
    ) => {
      clearTimeout(authTimeout)

      if (!payload || !payload.token) {
        const msg = 'Token is required for authentication'
        console.log(`[Auth] Failed (${socket.id}): ${msg}`)
        if (callback) callback({ success: false, error: msg })
        socket.disconnect(true)
        return
      }

      const user = await verifyToken(payload.token)

      if (!user) {
        const msg = 'Invalid or expired token'
        console.log(`[Auth] Failed (${socket.id}): ${msg}`)
        if (callback) callback({ success: false, error: msg })
        socket.disconnect(true)
        return
      }

      socketUsers.set(socket.id, user)
      console.log(
        `[Auth] Success (${socket.id}): ${user.email} (${user.role})`
      )

      if (callback) {
        callback({ success: true, user })
      }
    }
  )

  // --- JOIN ROOM ---
  socket.on(
    'join-room',
    (
      payload: JoinRoomPayload,
      callback?: (response: {
        success: boolean
        error?: string
        iceServers?: Array<{
          urls: string
          username?: string
          credential?: string
        }>
      }) => void
    ) => {
      const user = socketUsers.get(socket.id)

      if (!user) {
        if (callback)
          callback({
            success: false,
            error: 'Not authenticated. Send "auth" event first.',
          })
        return
      }

      if (!payload || !payload.roomId || !payload.userId || !payload.role) {
        if (callback)
          callback({
            success: false,
            error: 'roomId, userId, and role are required',
          })
        return
      }

      if (!['parent', 'nanny'].includes(payload.role)) {
        if (callback)
          callback({
            success: false,
            error: 'Only parent or nanny roles can join call rooms',
          })
        return
      }

      // Leave any existing rooms
      const existingRooms = socketRooms.get(socket.id) || []
      for (const room of existingRooms) {
        socket.leave(room)
      }

      // Join the new room
      socket.join(payload.roomId)
      socketRooms.set(socket.id, [payload.roomId])

      console.log(
        `[Room] ${user.email} (${payload.role}) joined room ${payload.roomId}`
      )

      // Notify others in the room
      socket.to(payload.roomId).emit('user-joined', {
        userId: payload.userId,
        role: payload.role,
        email: user.email,
        name: user.name,
        socketId: socket.id,
      })

      // Send ICE servers config
      const iceServers = getIceServers()
      if (callback) {
        callback({ success: true, iceServers })
      }
    }
  )

  // --- LEAVE ROOM ---
  socket.on('leave-room', (payload: LeaveRoomPayload) => {
    const user = socketUsers.get(socket.id)
    if (!payload || !payload.roomId) return

    socket.leave(payload.roomId)

    const currentRooms = socketRooms.get(socket.id) || []
    socketRooms.set(
      socket.id,
      currentRooms.filter((r) => r !== payload.roomId)
    )

    socket.to(payload.roomId).emit('user-left', {
      userId: user?.userId,
      role: user?.role,
      email: user?.email,
      name: user?.name,
      socketId: socket.id,
    })

    console.log(`[Room] ${user?.email} left room ${payload.roomId}`)
  })

  // --- SIGNAL (WebRTC) ---
  // Accepts both formats:
  //   Client format: { roomId, sdp } or { roomId, candidate } — broadcast to room
  //   Direct format: { roomId, targetUserId, signal } — route to specific user
  socket.on('signal', (payload: SignalPayload) => {
    const user = socketUsers.get(socket.id)
    if (!user) return
    if (!payload || !payload.roomId) return

    // Format 1: Client sends { roomId, sdp } or { roomId, candidate } directly
    if (payload.sdp || payload.candidate) {
      // Broadcast to all OTHER sockets in the room
      socket.to(payload.roomId).emit('signal', {
        fromUserId: user.userId,
        fromRole: user.role,
        sdp: payload.sdp,
        candidate: payload.candidate,
      })
      return
    }

    // Format 2: Direct routing with targetUserId
    if (payload.targetUserId && payload.signal) {
      const targetSocketId = findSocketByUserId(
        payload.targetUserId,
        payload.roomId
      )

      if (targetSocketId) {
        io.to(targetSocketId).emit('signal', {
          fromUserId: user.userId,
          fromRole: user.role,
          signal: payload.signal,
        })
      } else {
        console.log(
          `[Signal] Target user ${payload.targetUserId} not found in room ${payload.roomId}`
        )
      }
    }
  })

  // --- CHAT MESSAGE ---
  socket.on('chat-message', (payload: ChatMessagePayload) => {
    const user = socketUsers.get(socket.id)
    if (!user) return
    if (!payload || !payload.roomId || !payload.message) return

    io.to(payload.roomId).emit('chat-message', {
      fromUserId: user.userId,
      fromRole: user.role,
      fromEmail: user.email,
      fromName: user.name || user.email.split('@')[0],
      message: payload.message,
      timestamp: new Date().toISOString(),
    })
  })

  // --- DISCONNECT ---
  socket.on('disconnect', (reason) => {
    clearTimeout(authTimeout)

    const user = socketUsers.get(socket.id)
    const rooms = socketRooms.get(socket.id) || []

    for (const room of rooms) {
      socket.to(room).emit('user-left', {
        userId: user?.userId,
        role: user?.role,
        email: user?.email,
        name: user?.name,
        socketId: socket.id,
      })
      console.log(`[Room] ${user?.email} disconnected from room ${room}`)
    }

    socketUsers.delete(socket.id)
    socketRooms.delete(socket.id)
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`)
  })
})

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Signaling] Server running on port ${PORT}`)
  console.log(`[Signaling] CORS: origin=*`)
  console.log(`[Signaling] Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
function shutdown(signalName: string) {
  console.log(
    `\n[Signaling] ${signalName} received, shutting down gracefully...`
  )

  io.disconnectSockets(true)

  httpServer.close(() => {
    console.log('[Signaling] Server closed')
    process.exit(0)
  })

  setTimeout(() => {
    console.log('[Signaling] Forcing exit after timeout')
    process.exit(1)
  }, 5000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
