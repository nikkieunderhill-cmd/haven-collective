import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CountdownTimer from '@/components/donor/CountdownTimer'

interface Props {
  params: Promise<{ claimId: string }>
}

export default async function ClaimPage({ params }: Props) {
  const { claimId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: claim } = await supabase
    .from('claims')
    .select('*, requests(title, description, amount_needed, categories(name, icon, fulfillment_type))')
    .eq('id', claimId)
    .eq('donor_id', user!.id)
    .single()

  if (!claim) notFound()

  const req = claim.requests as any
  const cat = req?.categories as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Your active claim</h1>
        <p className="text-stone-500 text-sm mt-1">Thank you for helping someone in your community.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span>{cat?.icon}</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">{cat?.name}</span>
        </div>
        <p className="font-semibold text-stone-900">{req?.title}</p>
        {req?.amount_needed && (
          <p className="text-2xl font-bold text-teal-600">${Number(req.amount_needed).toFixed(2)}</p>
        )}
      </div>

      {claim.status === 'pending' && cat?.fulfillment_type === 'money' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <CountdownTimer lapseAt={claim.lapse_at} />

          {/* Payment form — Stripe Elements will go here */}
          <div className="p-6 border-2 border-dashed border-stone-300 rounded-xl text-center text-stone-400 text-sm">
            Stripe payment form — coming soon
          </div>

          <p className="text-xs text-stone-400 text-center">
            If payment isn't completed within 24 hours, the request will return to the pool for another donor to claim.
          </p>
        </div>
      )}

      {claim.status === 'pending' && cat?.fulfillment_type === 'goods' && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-sm text-teal-800">
          <p className="font-medium mb-1">Next steps for goods</p>
          <p>Our team will reach out to coordinate the exchange at a public location. Keep an eye on your email.</p>
        </div>
      )}

      {claim.status === 'paid' && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-sm text-teal-800">
          <p className="font-medium mb-1">Payment received ✓</p>
          <p>Our team is reviewing and will release the funds to the recipient shortly.</p>
        </div>
      )}

      {claim.status === 'lapsed' && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-sm text-stone-600">
          <p className="font-medium mb-1">This claim expired</p>
          <p>The request has been returned to the pool. Browse other requests to find someone else to help.</p>
          <a href="/donor/feed" className="inline-block mt-3 text-teal-600 hover:underline font-medium">Browse requests →</a>
        </div>
      )}
    </div>
  )
}
