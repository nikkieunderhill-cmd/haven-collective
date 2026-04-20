'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResolveFlagButton({ flagId }: { flagId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    await fetch('/api/admin/flags/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={resolve} disabled={loading} className="btn-secondary text-xs py-1.5 px-3">
      {loading ? '…' : 'Resolve'}
    </button>
  )
}
