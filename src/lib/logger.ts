type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// ANSI color codes for development
const colors: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
}
const reset = '\x1b[0m'
const dim = '\x1b[2m'

const isDev = process.env.NODE_ENV !== 'production'

// Async local storage for request ID (simple Map-based for edge compat)
const requestContext = new Map<string, string>()

export function setRequestId(id: string) {
  requestContext.set('requestId', id)
}

export function clearRequestId() {
  requestContext.delete('requestId')
}

export function getRequestId(): string | undefined {
  return requestContext.get('requestId')
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId?: string
  [key: string]: unknown
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, requestId, ...data } = entry
  const parts = [timestamp, level.toUpperCase().padEnd(5), message]
  if (requestId) parts.push(`[${requestId}]`)
  const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ''
  return parts.join(' ') + dataStr
}

function formatColorLog(entry: LogEntry): string {
  const { timestamp, level, message, requestId, ...data } = entry
  const color = colors[level]
  const parts = [
    `${dim}${timestamp}${reset}`,
    `${color}${level.toUpperCase().padEnd(5)}${reset}`,
    message,
  ]
  if (requestId) parts.push(`${dim}[${requestId}]${reset}`)
  const dataStr = Object.keys(data).length > 0 ? ` ${dim}${JSON.stringify(data)}${reset}` : ''
  return parts.join(' ') + dataStr
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: getRequestId(),
    ...data,
  }

  if (isDev) {
    const formatted = formatColorLog(entry)
    console.log(formatted)
  } else {
    const formatted = formatLog(entry)
    if (level === 'error') {
      console.error(formatted)
    } else if (level === 'warn') {
      console.warn(formatted)
    } else {
      console.log(formatted)
    }
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    log('debug', message, data)
  },
  info(message: string, data?: Record<string, unknown>) {
    log('info', message, data)
  },
  warn(message: string, data?: Record<string, unknown>) {
    log('warn', message, data)
  },
  error(message: string, data?: Record<string, unknown>) {
    log('error', message, data)
  },
}

// ─── API-specific logging helpers ────────────────────────────────────────────

export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  log(level, `${method} ${path} → ${statusCode} (${durationMs}ms)`, userId ? { userId } : undefined)
}

export function logApiError(
  method: string,
  path: string,
  error: unknown,
  userId?: string
) {
  const message = error instanceof Error ? error.message : String(error)
  log('error', `${method} ${path} — ${message}`, userId ? { userId, stack: error instanceof Error ? error.stack : undefined } : { stack: error instanceof Error ? error.stack : undefined })
}
