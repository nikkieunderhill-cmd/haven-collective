'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReleaseFundsButton({ claimId }: { claimId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRelease() {
    if (!confirm('Release funds to recipient?')) return
    setLoading(true)
    await fetch('/api/admin/claims/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleRelease} disabled={loading} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
      {loading ? 'Releasing…' : 'Release funds'}
    </button>
  )
}
