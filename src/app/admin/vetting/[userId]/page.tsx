import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VettingActions from '@/components/admin/VettingActions'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function VettingDetailPage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('recipient_profiles')
    .select(`*, users (email, created_at)`)
    .eq('user_id', userId)
    .single()

  if (!profile) notFound()

  // Generate signed URLs for documents
  let benefitsDocUrl: string | null = null
  let incomeDocUrl: string | null = null

  if (profile.benefits_doc_url) {
    const { data } = await supabase.storage
      .from('recipient-docs')
      .createSignedUrl(profile.benefits_doc_url, 3600)
    benefitsDocUrl = data?.signedUrl ?? null
  }

  if (profile.income_doc_url) {
    const { data } = await supabase.storage
      .from('recipient-docs')
      .createSignedUrl(profile.income_doc_url, 3600)
    incomeDocUrl = data?.signedUrl ?? null
  }

  const user = profile.users as any

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/vetting" className="text-stone-400 hover:text-stone-600 text-sm">← Vetting Queue</a>
      </div>

      <h1 className="text-2xl font-bold text-stone-900">{profile.full_name}</h1>

      <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
        <Section title="Personal Information">
          <Row label="Email" value={user?.email} />
          <Row label="Address" value={`${profile.address}, ${profile.city}, ${profile.state} ${profile.zip}`} />
          {profile.phone && <Row label="Phone" value={profile.phone} />}
        </Section>

        <Section title="Household">
          <Row label="Household size" value={`${profile.household_size} people`} />
          <Row label="Dependents" value={`${profile.num_dependents}`} />
        </Section>

        <Section title="Verification">
          <Row
            label="Stripe Identity"
            value={profile.stripe_identity_verified ? '✓ Verified' : '✗ Not verified'}
          />
          <Row label="Pathway" value={profile.verification_pathway ?? '—'} />
        </Section>

        <Section title="Documents">
          {benefitsDocUrl && (
            <div className="px-4 py-3">
              <p className="text-sm text-stone-500 mb-2">Benefits document</p>
              <a href={benefitsDocUrl} target="_blank" rel="noopener noreferrer"
                className="text-teal-600 hover:underline text-sm font-medium">
                View document →
              </a>
            </div>
          )}
          {incomeDocUrl && (
            <div className="px-4 py-3">
              <p className="text-sm text-stone-500 mb-2">Income document</p>
              <a href={incomeDocUrl} target="_blank" rel="noopener noreferrer"
                className="text-teal-600 hover:underline text-sm font-medium">
                View document →
              </a>
            </div>
          )}
          {!benefitsDocUrl && !incomeDocUrl && (
            <div className="px-4 py-3 text-sm text-stone-400">No documents uploaded</div>
          )}
        </Section>
      </div>

      <VettingActions userId={userId} applicantName={profile.full_name} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-2 bg-stone-50">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-900 font-medium">{value}</span>
    </div>
  )
}
