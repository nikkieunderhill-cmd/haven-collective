import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RequestReviewActions from '@/components/admin/RequestReviewActions'

interface Props {
  params: Promise<{ requestId: string }>
}

export default async function AdminRequestDetailPage({ params }: Props) {
  const { requestId } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('requests')
    .select('*, categories(name, icon), users!recipient_id(email)')
    .eq('id', requestId)
    .single()

  if (!req) notFound()

  let docUrl: string | null = null
  if (req.documentation_url) {
    const { data } = await supabase.storage
      .from('request-docs')
      .createSignedUrl(req.documentation_url, 3600)
    docUrl = data?.signedUrl ?? null
  }

  const cat = req.categories as any
  const user = req.users as any

  return (
    <div className="max-w-2xl space-y-6">
      <a href="/admin/requests" className="text-stone-400 hover:text-stone-600 text-sm">← Requests</a>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{cat?.icon}</span>
        <h1 className="text-2xl font-bold text-stone-900">{req.title}</h1>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
        <div className="px-4 py-3 bg-stone-50">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Request Details</p>
        </div>
        <div className="px-4 py-3 text-sm space-y-1">
          <p className="text-stone-500">Recipient</p>
          <p className="text-stone-900 font-medium">{user?.email}</p>
        </div>
        <div className="px-4 py-3 text-sm space-y-1">
          <p className="text-stone-500">Description</p>
          <p className="text-stone-900 leading-relaxed">{req.description}</p>
        </div>
        {req.amount_needed && (
          <div className="px-4 py-3 text-sm flex justify-between">
            <span className="text-stone-500">Amount requested</span>
            <span className="font-bold text-stone-900">${Number(req.amount_needed).toFixed(2)}</span>
          </div>
        )}
        {req.documentation_note && (
          <div className="px-4 py-3 text-sm space-y-1">
            <p className="text-stone-500">Written explanation</p>
            <p className="text-stone-900">{req.documentation_note}</p>
          </div>
        )}
        {docUrl && (
          <div className="px-4 py-3 text-sm space-y-1">
            <p className="text-stone-500">Supporting document</p>
            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-medium">View document →</a>
          </div>
        )}
      </div>

      {req.status === 'pending_review' && (
        <RequestReviewActions requestId={requestId} />
      )}

      {req.status !== 'pending_review' && (
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-500">
          Status: <span className="font-medium text-stone-900">{req.status.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  )
}
