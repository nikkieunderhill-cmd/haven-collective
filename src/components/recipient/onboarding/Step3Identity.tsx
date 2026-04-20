'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/recipient/onboarding/page'

interface Props {
  data: OnboardingData
  saving: boolean
  userId: string | null
  onBack: () => void
  onNext: (updates: Partial<OnboardingData>) => void
}

export default function Step3Identity({ data, saving, onBack, onNext }: Props) {
  const [verifying, setVerifying] = useState(false)

  // TODO: Replace with real Stripe Identity session when Stripe is connected
  async function startVerification() {
    setVerifying(true)
    // Placeholder: simulate verification
    await new Promise(r => setTimeout(r, 1500))
    onNext({ stripe_identity_verified: true })
    setVerifying(false)
  }

  if (data.stripe_identity_verified) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-1">Identity verified</h2>
          <p className="text-stone-500 text-sm">Your identity has been confirmed. Your ID is never stored by us.</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <span className="text-2xl">✓</span>
          <span className="text-teal-800 font-medium">Identity verified successfully</span>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
          <button type="button" onClick={() => onNext({})} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Continue →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Verify your identity</h2>
        <p className="text-stone-500 text-sm">
          We use Stripe Identity to confirm who you are. You&apos;ll photograph your ID with your phone camera.
          We never store your ID — only a verified/not verified result.
        </p>
      </div>

      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-sm text-stone-600">
        <p className="font-medium text-stone-800">What you&apos;ll need:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>A valid government-issued ID (driver&apos;s license, passport, or state ID)</li>
          <li>Your phone camera to photograph it</li>
        </ul>
      </div>

      {/* Stripe Identity will be embedded here */}
      <div className="p-6 border-2 border-dashed border-stone-300 rounded-xl text-center text-stone-400 text-sm">
        Stripe Identity verification — coming soon
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button
          type="button"
          onClick={startVerification}
          disabled={verifying || saving}
          className="btn-primary flex-1"
        >
          {verifying ? 'Verifying…' : 'Start verification'}
        </button>
      </div>
    </div>
  )
}
