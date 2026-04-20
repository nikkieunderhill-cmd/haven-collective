'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  applicantName: string
}

export default function VettingActions({ userId, applicantName }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<'approve' | 'deny' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (action === 'deny' && !reason.trim()) {
      setError('Please provide a reason for denial.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/vetting/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, reason }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/admin/vetting')
    router.refresh()
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-stone-900">Decision</h2>

      {!action ? (
        <div className="flex gap-3">
          <button onClick={() => setAction('approve')} className="btn-primary flex-1">
            Approve application
          </button>
          <button onClick={() => setAction('deny')} className="btn-danger flex-1">
            Deny application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg text-sm font-medium ${
            action === 'approve' ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'
          }`}>
            {action === 'approve'
              ? `Approving ${applicantName}'s application`
              : `Denying ${applicantName}'s application`}
          </div>

          {action === 'deny' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Reason for denial <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Explain why this application is being denied. This will be shared with the applicant."
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => { setAction(null); setReason('') }} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className={`flex-1 ${action === 'approve' ? 'btn-primary' : 'btn-danger'}`}>
              {loading ? 'Submitting…' : `Confirm ${action}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
