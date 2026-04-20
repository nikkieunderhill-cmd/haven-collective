'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, SenderType } from '@/types/database'

interface Props {
  requestId: string
  currentUserId: string
  currentUserType: SenderType
}

export default function MessageThread({ requestId, currentUserId, currentUserType }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.from('messages').select('*').eq('request_id', requestId).order('sent_at')
      .then(({ data }) => setMessages(data ?? []))

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `request_id=eq.${requestId}`,
      }, payload => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
        <p className="text-sm font-semibold text-stone-700">Anonymous messages</p>
        <p className="text-xs text-stone-400 mt-0.5">No identifying information is shared.</p>
      </div>

      <div className="p-4 space-y-3 min-h-32 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-6">No messages yet.</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                isMe ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-900'
              }`}>
                {!isMe && (
                  <p className="text-xs font-semibold mb-1 opacity-60 capitalize">{msg.sender_type}</p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-stone-100 flex gap-2">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Send an anonymous message…"
          className="input flex-1 py-2 text-sm"
        />
        <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  )
}
