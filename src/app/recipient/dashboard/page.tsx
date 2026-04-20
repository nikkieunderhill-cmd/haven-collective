import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Request } from '@/types/database'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:          { label: 'Draft',          color: 'bg-stone-100 text-stone-600' },
  pending_review: { label: 'In Review',      color: 'bg-amber-100 text-amber-700' },
  active:         { label: 'Active',         color: 'bg-teal-100 text-teal-700' },
  claimed:        { label: 'Claimed',        color: 'bg-blue-100 text-blue-700' },
  fulfilled:      { label: 'Fulfilled ✓',   color: 'bg-green-100 text-green-700' },
  denied:         { label: 'Denied',         color: 'bg-red-100 text-red-700' },
  expired:        { label: 'Expired',        color: 'bg-stone-100 text-stone-400' },
}

export default async function RecipientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('requests')
    .select('*, categories(name, icon)')
    .eq('recipient_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const activeRequest = requests?.find(r => ['active', 'claimed', 'pending_review'].includes(r.status))

  return (
    <div className="space-y-6">
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id} className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm">
              <p className="font-medium text-teal-900">{n.title}</p>
              <p className="text-teal-700 mt-0.5">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {!activeRequest && (
        <div className="bg-white border-2 border-dashed border-stone-200 rounded-xl p-8 text-center">
          <p className="text-2xl mb-3">🤝</p>
          <p className="font-semibold text-stone-900 mb-1">Ready to post a request?</p>
          <p className="text-stone-500 text-sm mb-4">Tell us what you need and our donors will help.</p>
          <Link href="/recipient/requests/new" className="btn-primary inline-block">
            Create a request
          </Link>
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-stone-900">Your requests</h2>
          {requests.map((req: any) => {
            const badge = STATUS_LABELS[req.status] ?? { label: req.status, color: 'bg-stone-100 text-stone-600' }
            return (
              <Link
                key={req.id}
                href={`/recipient/requests/${req.id}`}
                className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span>{req.categories?.icon}</span>
                    <p className="font-semibold text-stone-900">{req.title}</p>
                  </div>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {req.amount_needed ? `$${Number(req.amount_needed).toFixed(2)}` : 'Goods'} ·{' '}
                    {new Date(req.created_at).toLocaleDateString()}
                    {req.status === 'active' && ` · ${req.view_count} views`}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
