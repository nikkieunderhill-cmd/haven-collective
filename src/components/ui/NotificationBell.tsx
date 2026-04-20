'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifications(data ?? [])
    }

    load()

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead() }}
        className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="font-semibold text-stone-900 text-sm">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-stone-400 text-sm">No notifications yet</p>
          ) : (
            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {notifications.map(n => (
                <a
                  key={n.id}
                  href={n.action_url ?? '#'}
                  className={`block px-4 py-3 hover:bg-stone-50 transition-colors ${!n.read_at ? 'bg-teal-50' : ''}`}
                >
                  <p className="text-sm font-medium text-stone-900">{n.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-stone-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
