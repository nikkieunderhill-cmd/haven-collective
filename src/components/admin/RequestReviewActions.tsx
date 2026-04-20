'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { requestId: string }

export default function RequestReviewActions({ requestId }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<'approve' | 'deny' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (action === 'deny' && !reason.trim()) { setError('Please provide a denial reason.'); return }
    setLoading(true)
    const res = await fetch('/api/admin/requests/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action, reason }),
    })
    if (!res.ok) { setError('Something went wrong.'); setLoading(false); return }
    router.push('/admin/requests')
    router.refresh()
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-stone-900">Review decision</h2>
      {!action ? (
        <div className="flex gap-3">
          <button onClick={() => setAction('approve')} className="btn-primary flex-1">Approve & publish</button>
          <button onClick={() => setAction('deny')} className="btn-danger flex-1">Deny request</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg text-sm font-medium ${action === 'approve' ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'}`}>
            {action === 'approve' ? 'Approving request — it will go live immediately' : 'Denying request'}
          </div>
          {action === 'deny' && (
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="input resize-none" placeholder="Reason (shared with recipient)…" />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => { setAction(null); setReason('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className={`flex-1 ${action === 'approve' ? 'btn-primary' : 'btn-danger'}`}>
              {loading ? 'Submitting…' : `Confirm ${action}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
