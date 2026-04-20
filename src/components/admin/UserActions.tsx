'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { userId: string; currentStatus: string; userEmail: string }

export default function UserActions({ userId, currentStatus, userEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [showBanForm, setShowBanForm] = useState(false)

  async function updateStatus(status: string, reason?: string) {
    setLoading(true)
    await fetch('/api/admin/users/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status, reason }),
    })
    setLoading(false)
    setOpen(false)
    setShowBanForm(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm hover:bg-stone-50 text-stone-600">
        Actions ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden text-sm">
          {currentStatus !== 'active' && (
            <button onClick={() => updateStatus('active')} disabled={loading} className="w-full text-left px-4 py-2.5 hover:bg-stone-50 text-stone-700">
              ✓ Activate
            </button>
          )}
          {currentStatus !== 'suspended' && (
            <button onClick={() => updateStatus('suspended')} disabled={loading} className="w-full text-left px-4 py-2.5 hover:bg-stone-50 text-amber-700">
              ⏸ Suspend
            </button>
          )}
          {currentStatus !== 'banned' && (
            <button onClick={() => setShowBanForm(true)} className="w-full text-left px-4 py-2.5 hover:bg-stone-50 text-red-700">
              🚫 Ban
            </button>
          )}
        </div>
      )}
      {showBanForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-stone-900">Ban {userEmail}?</h3>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} className="input resize-none" placeholder="Reason for ban…" />
            <div className="flex gap-3">
              <button onClick={() => setShowBanForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => updateStatus('banned', banReason)} disabled={loading || !banReason} className="btn-danger flex-1">Confirm ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
