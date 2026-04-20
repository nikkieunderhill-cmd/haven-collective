import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClaimButton from '@/components/donor/ClaimButton'

interface Props {
  params: Promise<{ requestId: string }>
}

export default async function DonorRequestDetailPage({ params }: Props) {
  const { requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: req } = await supabase
    .from('requests')
    .select('*, categories(name, icon, fulfillment_type)')
    .eq('id', requestId)
    .eq('status', 'active')
    .single()

  if (!req) notFound()

  // Increment view count
  await supabase.from('requests').update({ view_count: req.view_count + 1 }).eq('id', requestId)

  // Check if donor has an active claim already
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id')
    .eq('donor_id', user!.id)
    .eq('status', 'pending')
    .single()

  const cat = req.categories as any

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      <a href="/donor/feed" className="text-stone-400 hover:text-stone-600 text-sm">← Browse requests</a>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat?.icon}</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">{cat?.name}</span>
          <span className="ml-auto text-xs text-stone-400">{timeAgo(req.created_at)}</span>
        </div>

        <h1 className="text-xl font-bold text-stone-900">{req.title}</h1>
        <p className="text-stone-600 leading-relaxed">{req.description}</p>

        {req.amount_needed && (
          <p className="text-3xl font-bold text-teal-600">${Number(req.amount_needed).toFixed(2)}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">✓ Identity verified</span>
          <span className="text-sm px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">✓ Need verified</span>
        </div>
      </div>

      <ClaimButton
        requestId={requestId}
        amount={req.amount_needed}
        fulfillmentType={cat?.fulfillment_type}
        hasExistingClaim={!!existingClaim}
      />
    </div>
  )
}
