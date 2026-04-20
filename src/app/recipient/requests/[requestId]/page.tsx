import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

const STATUS_STEPS = ['pending_review', 'active', 'claimed', 'fulfilled']

interface Props {
  params: Promise<{ requestId: string }>
}

export default async function RequestStatusPage({ params }: Props) {
  const { requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: req } = await supabase
    .from('requests')
    .select('*, categories(name, icon)')
    .eq('id', requestId)
    .eq('recipient_id', user!.id)
    .single()

  if (!req) notFound()

  const currentStepIndex = STATUS_STEPS.indexOf(req.status)
  const cat = req.categories as any

  return (
    <div className="space-y-6">
      <a href="/recipient/dashboard" className="text-stone-400 hover:text-stone-600 text-sm">← Dashboard</a>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat?.icon}</span>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{cat?.name}</span>
          </div>
          {req.status === 'active' && (
            <span className="text-xs text-stone-400">{req.view_count} views</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-stone-900">{req.title}</h1>
        <p className="text-stone-600 text-sm leading-relaxed">{req.description}</p>
        {req.amount_needed && (
          <p className="text-2xl font-bold text-teal-600">${Number(req.amount_needed).toFixed(2)}</p>
        )}

        {req.status === 'denied' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
            <p className="font-medium text-red-800 mb-1">Request denied</p>
            <p className="text-red-700">{req.denial_reason}</p>
            <a href="/recipient/requests/new" className="inline-block mt-3 text-teal-600 hover:underline font-medium">Submit a new request →</a>
          </div>
        )}

        {!['denied', 'expired'].includes(req.status) && (
          <div className="pt-2">
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${
                    i <= currentStepIndex ? 'bg-teal-500' : 'bg-stone-200'
                  }`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['In Review', 'Active', 'Claimed', 'Fulfilled'].map((label, i) => (
                <span key={label} className={`text-xs ${i <= currentStepIndex ? 'text-teal-600 font-medium' : 'text-stone-400'}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
