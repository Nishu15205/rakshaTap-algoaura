'use client'

/**
 * Client-side session management for idle timeout detection.
 *
 * Usage:
 *   import { sessionManager } from '@/lib/session-manager'
 *
 *   useEffect(() => {
 *     sessionManager.start(() => {
 *       // Called when session expires due to inactivity
 *       toast({ title: 'Session expired', description: 'Please log in again.' })
 *       logout()
 *     })
 *     return () => sessionManager.stop()
 *   }, [])
 */

// Default idle timeout: 30 minutes (configurable via env)
const IDLE_TIMEOUT = 30 * 60 * 1000
// Check for idle every 60 seconds
const CHECK_INTERVAL = 60000

export class SessionManager {
  private lastActivity: number = Date.now()
  private checkIntervalId: ReturnType<typeof setInterval> | null = null
  private onExpired: (() => void) | null = null

  start(onExpired: () => void) {
    this.onExpired = onExpired
    this.lastActivity = Date.now()

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, this.recordActivity, { passive: true })
    })

    // Check periodically
    this.checkIntervalId = setInterval(this.checkIdle, CHECK_INTERVAL)
  }

  private recordActivity = () => {
    this.lastActivity = Date.now()
  }

  private checkIdle = () => {
    const elapsed = Date.now() - this.lastActivity
    if (elapsed >= IDLE_TIMEOUT && this.onExpired) {
      this.stop()
      this.onExpired()
    }
  }

  /** Get remaining time before idle timeout in milliseconds */
  getRemainingTime(): number {
    return Math.max(0, IDLE_TIMEOUT - (Date.now() - this.lastActivity))
  }

  /** Check if session is idle */
  isIdle(): boolean {
    return (Date.now() - this.lastActivity) >= IDLE_TIMEOUT
  }

  /** Reset the activity timer manually */
  reset() {
    this.lastActivity = Date.now()
  }

  stop() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }

    // Remove activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.removeEventListener(event, this.recordActivity)
    })
  }
}

export const sessionManager = new SessionManager()
