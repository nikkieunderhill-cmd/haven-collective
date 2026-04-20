'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressSteps from '@/components/ui/ProgressSteps'
import Step1Personal from '@/components/recipient/onboarding/Step1Personal'
import Step2Household from '@/components/recipient/onboarding/Step2Household'
import Step3Identity from '@/components/recipient/onboarding/Step3Identity'
import Step4NeedsVerification from '@/components/recipient/onboarding/Step4NeedsVerification'
import Step5Review from '@/components/recipient/onboarding/Step5Review'

const STEPS = [
  { number: 1, label: 'Personal' },
  { number: 2, label: 'Household' },
  { number: 3, label: 'Identity' },
  { number: 4, label: 'Verification' },
  { number: 5, label: 'Review' },
]

export type OnboardingData = {
  full_name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  household_size: number
  num_dependents: number
  stripe_identity_verified: boolean
  verification_pathway: 'benefits' | 'income' | null
  benefits_doc_url: string | null
  income_doc_url: string | null
}

const INITIAL_DATA: OnboardingData = {
  full_name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  household_size: 1,
  num_dependents: 0,
  stripe_identity_verified: false,
  verification_pathway: null,
  benefits_doc_url: null,
  income_doc_url: null,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      // Resume from saved progress
      supabase
        .from('recipient_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setData(d => ({ ...d, ...profile }))
            setStep(profile.application_step || 1)
          }
        })
    })
  }, [router])

  async function saveProgress(updates: Partial<OnboardingData>, nextStep: number) {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    const newData = { ...data, ...updates }
    setData(newData)

    await supabase.from('recipient_profiles').upsert({
      user_id: userId,
      ...newData,
      application_step: nextStep,
    }, { onConflict: 'user_id' })

    setSaving(false)
    setStep(nextStep)
  }

  async function handleSubmit() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('recipient_profiles').upsert({
      user_id: userId,
      ...data,
      application_step: 5,
    }, { onConflict: 'user_id' })

    // Update user status to pending review
    await supabase.from('users').update({ status: 'pending' }).eq('id', userId)

    // Audit log
    await supabase.from('audit_log').insert({
      actor_id: userId,
      action: 'recipient_application_submitted',
      entity_type: 'recipient_profile',
      entity_id: userId,
    })

    setSaving(false)
    router.push('/recipient/pending')
  }

  const stepProps = { data, saving }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Apply for Support</h1>
          <p className="text-stone-500 mt-1 text-sm">Your information is kept private and secure.</p>
        </div>

        <ProgressSteps steps={STEPS} currentStep={step} />

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {step === 1 && (
            <Step1Personal
              {...stepProps}
              onNext={updates => saveProgress(updates, 2)}
            />
          )}
          {step === 2 && (
            <Step2Household
              {...stepProps}
              onBack={() => setStep(1)}
              onNext={updates => saveProgress(updates, 3)}
            />
          )}
          {step === 3 && (
            <Step3Identity
              {...stepProps}
              userId={userId}
              onBack={() => setStep(2)}
              onNext={updates => saveProgress(updates, 4)}
            />
          )}
          {step === 4 && (
            <Step4NeedsVerification
              {...stepProps}
              userId={userId}
              onBack={() => setStep(3)}
              onNext={updates => saveProgress(updates, 5)}
            />
          )}
          {step === 5 && (
            <Step5Review
              {...stepProps}
              onBack={() => setStep(4)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
