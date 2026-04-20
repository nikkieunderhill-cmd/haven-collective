'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  requestId: string
  amount: number | null
  fulfillmentType: string
  hasExistingClaim: boolean
}

export default function ClaimButton({ requestId, amount, fulfillmentType, hasExistingClaim }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/donor/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push(`/donor/claims/${data.claimId}`)
  }

  if (hasExistingClaim) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        <p className="font-medium mb-1">You already have an active claim</p>
        <p>Complete or let your current claim expire before claiming another request.</p>
        <a href="/donor/history" className="inline-block mt-3 text-teal-600 hover:underline font-medium">View your active claim →</a>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <div>
        <p className="font-semibold text-stone-900 mb-1">Ready to help?</p>
        <p className="text-stone-500 text-sm">
          {fulfillmentType === 'goods'
            ? 'Claiming this will reserve it for you. Our team will coordinate the goods exchange.'
            : `You'll have 24 hours to complete the ${amount ? `$${Number(amount).toFixed(2)}` : ''} payment after claiming.`}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button onClick={handleClaim} disabled={loading} className="btn-primary w-full text-lg py-4">
        {loading ? 'Claiming…' : '💛 Claim this request'}
      </button>

      <p className="text-xs text-stone-400 text-center">
        Your personal information is never shared with the recipient.
      </p>
    </div>
  )
}
