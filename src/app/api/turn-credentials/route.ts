import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Metered.ca TURN server base URLs
const TURN_SERVERS = [
  'turn:a.relay.metered.ca:80',
  'turn:a.relay.metered.ca:443',
  'turn:a.relay.metered.ca:443?transport=tcp',
  'turn:b.relay.metered.ca:80',
  'turn:b.relay.metered.ca:443',
  'turn:b.relay.metered.ca:443?transport=tcp',
]

// Shared secret for HMAC-SHA256 TURN credentials (Twilio-style)
const TURN_SHARED_SECRET = process.env.TURN_SHARED_SECRET || 'default-secret'

// Credential validity period (24 hours by default)
const CREDENTIAL_TTL = parseInt(process.env.TURN_CREDENTIAL_TTL || '86400', 10)

/**
 * Generate time-limited HMAC-SHA256 TURN credentials (Twilio approach).
 *
 * Username format:  {timestamp}:{userId}
 * Credential:       HMAC-SHA256({timestamp}:{userId}, sharedSecret)
 *
 * The credential is valid until timestamp + TTL.
 */
function generateTurnCredential(userId: string): { username: string; credential: string; expiry: number } {
  const timestamp = Math.floor(Date.now() / 1000) + CREDENTIAL_TTL
  const username = `${timestamp}:${userId}`
  const credential = crypto.createHmac('sha256', TURN_SHARED_SECRET).update(username).digest('base64')

  return { username, credential, expiry: timestamp }
}

// GET /api/turn-credentials?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!TURN_SHARED_SECRET) {
      return NextResponse.json(
        { success: false, error: 'TURN server not configured. Set TURN_SHARED_SECRET env var.' },
        { status: 503 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Generate time-limited credentials
    const { username, credential, expiry } = generateTurnCredential(userId)

    // Build ICE server list with temporary credentials
    const iceServers = [
      // Google STUN servers (no auth needed)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },

      // Metered.ca STUN servers
      { urls: 'stun:stun.relay.metered.ca:80' },
      { urls: 'stun:stun.relay.metered.ca:443' },

      // Metered.ca TURN servers with time-limited credentials
      ...TURN_SERVERS.map((url) => ({
        urls: url,
        username,
        credential,
      })),
    ]

    return NextResponse.json({
      success: true,
      data: {
        iceServers,
        ttl: CREDENTIAL_TTL,
        expiresAt: new Date(expiry * 1000).toISOString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate TURN credentials'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
