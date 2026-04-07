'use client'

import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'

const typeConfig = {
  info: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-50' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const { notifications, isAuthenticated, markNotificationRead } = useAppStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!isAuthenticated) return null

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id)
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-stone-100/60 transition-colors group">
          <Bell className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-r from-rose-400 to-pink-500 text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 rounded-2xl" align="end" sideOffset={8}>
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-stone-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-rose-400 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-7 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-72">
          <div className="divide-y divide-stone-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                <p className="text-sm text-stone-400">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.info
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`w-full flex items-start gap-3 p-3 text-left hover:bg-stone-50/80 transition-colors ${
                      !notification.read ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-stone-700 truncate">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-stone-300 mt-1">
                        {formatTimeAgo(new Date(notification.createdAt))}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
