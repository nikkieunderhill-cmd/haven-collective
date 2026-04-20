'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressSteps from '@/components/ui/ProgressSteps'
import type { Category } from '@/types/database'

const STEPS = [
  { number: 1, label: 'Category' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Documents' },
  { number: 4, label: 'Preview' },
  { number: 5, label: 'Submit' },
]

type DocRequirement = 'none' | 'explanation' | 'one_doc' | 'full_doc'

function getDocRequirement(category: Category | null, amount: number | null): DocRequirement {
  if (!category || category.fulfillment_type === 'goods') return 'none'
  if (!amount) return 'explanation'
  if (amount < 75) return 'explanation'
  if (amount <= 300) return 'one_doc'
  return 'full_doc'
}

export default function NewRequestPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [docNote, setDocNote] = useState('')
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasActiveRequest, setHasActiveRequest] = useState(false)

  const docReq = getDocRequirement(selectedCategory, amount)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      // Check for existing active request
      supabase
        .from('requests')
        .select('id')
        .eq('recipient_id', user.id)
        .in('status', ['draft', 'pending_review', 'active', 'claimed'])
        .single()
        .then(({ data }) => setHasActiveRequest(!!data))
    })
    supabase.from('categories').select('*').eq('is_active', true).order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !userId) return
    setUploading(true)
    const file = e.target.files[0]
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/request-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('request-docs').upload(path, file)
    if (!error && data) setDocUrl(data.path)
    setUploading(false)
  }

  async function handleSubmit() {
    if (!userId || !selectedCategory) return
    setSubmitting(true)
    const supabase = createClient()

    const isHighValue = selectedCategory.fulfillment_type === 'money' && amount && amount > 300
    const status = isHighValue ? 'pending_review' : 'active'

    const { data: req, error } = await supabase.from('requests').insert({
      recipient_id: userId,
      category_id: selectedCategory.id,
      title,
      description,
      amount_needed: amount,
      documentation_url: docUrl,
      documentation_note: docNote || null,
      status,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).select().single()

    if (!error && req) {
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'request_submitted',
        entity_type: 'request',
        entity_id: req.id,
        metadata: { status },
      })
      router.push('/recipient/dashboard')
    }
    setSubmitting(false)
  }

  if (hasActiveRequest) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
        <p className="text-2xl mb-3">⚠️</p>
        <p className="font-semibold text-stone-900 mb-2">You already have an active request</p>
        <p className="text-stone-500 text-sm mb-4">You can only have one active request at a time. Check your dashboard for its status.</p>
        <a href="/recipient/dashboard" className="btn-primary inline-block">Go to dashboard</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Create a request</h1>
      <ProgressSteps steps={STEPS} currentStep={step} />

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        {/* Step 1: Category */}
        {step === 1 && (
          <>
            <h2 className="font-semibold text-stone-900">What do you need help with?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left p-4 border-2 rounded-xl transition-colors ${
                    selectedCategory?.id === cat.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-stone-200 hover:border-teal-300'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <p className="font-medium text-stone-900 mt-1">{cat.name}</p>
                  <p className="text-stone-500 text-xs mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedCategory}
              className="btn-primary w-full disabled:opacity-40"
            >
              Continue →
            </button>
          </>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <>
            <h2 className="font-semibold text-stone-900">{selectedCategory?.icon} {selectedCategory?.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input"
                  placeholder={selectedCategory?.fulfillment_type === 'money' ? 'e.g. Help with electricity bill' : 'e.g. Winter coats for my kids'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Describe your situation</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder="Share as much or as little as you feel comfortable with. Donors will read this."
                />
              </div>
              {selectedCategory?.fulfillment_type === 'money' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Amount needed ($)
                    {selectedCategory.funding_cap && (
                      <span className="text-stone-400 font-normal ml-1">max ${selectedCategory.funding_cap}</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedCategory.funding_cap ?? undefined}
                    value={amount ?? ''}
                    onChange={e => setAmount(Number(e.target.value) || null)}
                    className="input w-40"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!title || !description || (selectedCategory?.fulfillment_type === 'money' && !amount)}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Documentation */}
        {step === 3 && (
          <>
            <h2 className="font-semibold text-stone-900">Supporting documentation</h2>
            {docReq === 'none' && (
              <div className="p-4 bg-stone-50 rounded-xl text-sm text-stone-600">
                No documentation required for goods requests.
              </div>
            )}
            {docReq === 'explanation' && (
              <div className="space-y-3">
                <p className="text-sm text-stone-500">For requests under $75, a brief written explanation is all we need.</p>
                <textarea
                  value={docNote}
                  onChange={e => setDocNote(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Briefly explain your need…"
                />
              </div>
            )}
            {(docReq === 'one_doc' || docReq === 'full_doc') && (
              <div className="space-y-3">
                <p className="text-sm text-stone-500">
                  {docReq === 'one_doc'
                    ? 'Please upload one supporting document (bill, invoice, or shutoff notice).'
                    : 'For requests over $300, please upload full supporting documentation. Your request will be reviewed by an admin before going live.'}
                </p>
                {!docUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-teal-400 transition-colors">
                    <span className="text-xl mb-1">📄</span>
                    <span className="text-sm text-stone-500">{uploading ? 'Uploading…' : 'Click to upload'}</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm">
                    <span>✓</span>
                    <span className="text-teal-800 font-medium">Document uploaded</span>
                    <button onClick={() => setDocUrl(null)} className="ml-auto text-xs text-teal-600 hover:underline">Replace</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button
                onClick={() => setStep(4)}
                disabled={
                  (docReq === 'explanation' && !docNote) ||
                  ((docReq === 'one_doc' || docReq === 'full_doc') && !docUrl)
                }
                className="btn-primary flex-1 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <>
            <h2 className="font-semibold text-stone-900">Preview — what donors will see</h2>
            <div className="border border-stone-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCategory?.icon}</span>
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{selectedCategory?.name}</span>
              </div>
              <p className="font-semibold text-stone-900">{title}</p>
              <p className="text-stone-600 text-sm leading-relaxed">{description}</p>
              {amount && (
                <p className="text-2xl font-bold text-teal-600">${Number(amount).toFixed(2)}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium">✓ Verified</span>
                <span>Just now</span>
              </div>
            </div>
            {amount && amount > 300 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                This request will be reviewed by our team before going live (typically within 24 hours).
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(5)} className="btn-primary flex-1">Looks good →</button>
            </div>
          </>
        )}

        {/* Step 5: Submit */}
        {step === 5 && (
          <>
            <h2 className="font-semibold text-stone-900">Ready to submit?</h2>
            <p className="text-stone-500 text-sm">Once submitted, your request will be visible to donors{amount && amount > 300 ? ' after admin review' : ' immediately'}.</p>
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="btn-secondary flex-1">← Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
