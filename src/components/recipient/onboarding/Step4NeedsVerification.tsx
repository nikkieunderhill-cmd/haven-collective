'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingData } from '@/app/recipient/onboarding/page'

interface Props {
  data: OnboardingData
  saving: boolean
  userId: string | null
  onBack: () => void
  onNext: (updates: Partial<OnboardingData>) => void
}

const BENEFITS_OPTIONS = [
  'SNAP (food stamps)',
  'WIC',
  'Medicaid / Medi-Cal',
  'Section 8 / Housing Choice Voucher',
  'Free or reduced-price school lunch letter',
]

export default function Step4NeedsVerification({ data, saving, userId, onBack, onNext }: Props) {
  const [pathway, setPathway] = useState<'benefits' | 'income' | null>(data.verification_pathway)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    data.benefits_doc_url || data.income_doc_url || null
  )
  const [error, setError] = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !userId) return
    const file = e.target.files[0]
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${pathway}-doc.${ext}`

    const { data: upload, error: uploadError } = await supabase.storage
      .from('recipient-docs')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    setUploadedUrl(upload.path)
    setUploading(false)
  }

  function handleContinue() {
    if (!pathway || !uploadedUrl) return
    onNext({
      verification_pathway: pathway,
      benefits_doc_url: pathway === 'benefits' ? uploadedUrl : null,
      income_doc_url: pathway === 'income' ? uploadedUrl : null,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Verify your need</h2>
        <p className="text-stone-500 text-sm">
          Choose whichever option works best for you. There&apos;s no wrong answer — we just need to confirm
          your situation to connect you with the right support.
        </p>
      </div>

      {!pathway && (
        <div className="space-y-3">
          <button
            onClick={() => setPathway('benefits')}
            className="w-full text-left p-4 border-2 border-stone-200 hover:border-teal-400 rounded-xl transition-colors"
          >
            <p className="font-semibold text-stone-900">I receive government benefits</p>
            <p className="text-stone-500 text-sm mt-1">
              Upload proof of enrollment in SNAP, WIC, Medicaid, Section 8, or free/reduced lunch.
            </p>
          </button>
          <button
            onClick={() => setPathway('income')}
            className="w-full text-left p-4 border-2 border-stone-200 hover:border-teal-400 rounded-xl transition-colors"
          >
            <p className="font-semibold text-stone-900">I don&apos;t have benefits documents</p>
            <p className="text-stone-500 text-sm mt-1">
              Upload a recent pay stub, bank statement, or prior year tax return instead.
            </p>
          </button>
        </div>
      )}

      {pathway && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPathway(null); setUploadedUrl(null) }}
              className="text-teal-600 text-sm hover:underline"
            >
              ← Change option
            </button>
            <span className="text-stone-400 text-sm">
              {pathway === 'benefits' ? 'Benefits enrollment proof' : 'Income documentation'}
            </span>
          </div>

          {pathway === 'benefits' && (
            <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-600">
              <p className="font-medium mb-1">Accepted documents:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                {BENEFITS_OPTIONS.map(o => <li key={o}>{o}</li>)}
              </ul>
            </div>
          )}

          {pathway === 'income' && (
            <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-600">
              <p className="font-medium mb-1">Accepted documents:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Recent pay stub (within 30 days)</li>
                <li>Bank statement (within 60 days)</li>
                <li>Prior year tax return (1040)</li>
              </ul>
            </div>
          )}

          {!uploadedUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-teal-400 transition-colors">
              <span className="text-2xl mb-1">📄</span>
              <span className="text-sm text-stone-500">
                {uploading ? 'Uploading…' : 'Click to upload your document'}
              </span>
              <span className="text-xs text-stone-400 mt-1">PDF, JPG, or PNG</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <span className="text-xl">✓</span>
              <div>
                <p className="text-teal-800 font-medium text-sm">Document uploaded</p>
                <button
                  onClick={() => setUploadedUrl(null)}
                  className="text-xs text-teal-600 hover:underline mt-0.5"
                >
                  Upload a different file
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!pathway || !uploadedUrl || saving}
          className="btn-primary flex-1 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
