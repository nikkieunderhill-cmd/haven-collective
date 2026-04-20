'use client'

import type { OnboardingData } from '@/app/recipient/onboarding/page'

interface Props {
  data: OnboardingData
  saving: boolean
  onBack: () => void
  onSubmit: () => void
}

export default function Step5Review({ data, saving, onBack, onSubmit }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Review your application</h2>
        <p className="text-stone-500 text-sm">Please confirm everything looks correct before submitting.</p>
      </div>

      <div className="space-y-3">
        <ReviewSection title="Personal Information">
          <ReviewRow label="Full name" value={data.full_name} />
          <ReviewRow label="Address" value={`${data.address}, ${data.city}, ${data.state} ${data.zip}`} />
          {data.phone && <ReviewRow label="Phone" value={data.phone} />}
        </ReviewSection>

        <ReviewSection title="Household">
          <ReviewRow label="Household size" value={`${data.household_size} people`} />
          <ReviewRow label="Dependents" value={`${data.num_dependents}`} />
        </ReviewSection>

        <ReviewSection title="Verification">
          <ReviewRow
            label="Identity"
            value={data.stripe_identity_verified ? '✓ Verified' : '⚠ Not verified'}
          />
          <ReviewRow
            label="Needs verification"
            value={data.verification_pathway === 'benefits'
              ? '✓ Benefits document uploaded'
              : data.verification_pathway === 'income'
              ? '✓ Income document uploaded'
              : '⚠ Missing'
            }
          />
        </ReviewSection>
      </div>

      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-800">
        <p className="font-medium mb-1">What happens next?</p>
        <p>Our team will review your application within 24–48 hours. You&apos;ll receive an email when a decision is made. If we need anything else, we&apos;ll reach out.</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <div className="bg-stone-50 px-4 py-2 border-b border-stone-200">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-900 font-medium text-right">{value}</span>
    </div>
  )
}
