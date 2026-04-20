import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminRequestsPage({ searchParams }: Props) {
  const { filter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('requests')
    .select('*, categories(name, icon), users!recipient_id(email)')
    .order('created_at', { ascending: true })

  if (filter === 'pending_review') {
    query = query.eq('status', 'pending_review')
  } else {
    query = query.in('status', ['pending_review', 'active', 'claimed', 'fulfilled', 'denied'])
  }

  const { data: requests } = await query

  const STATUS_COLORS: Record<string, string> = {
    pending_review: 'bg-amber-100 text-amber-700',
    active: 'bg-teal-100 text-teal-700',
    claimed: 'bg-blue-100 text-blue-700',
    fulfilled: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Requests</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/requests" className={`px-3 py-1.5 rounded-lg ${!filter ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>All</Link>
          <Link href="/admin/requests?filter=pending_review" className={`px-3 py-1.5 rounded-lg ${filter === 'pending_review' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>Pending review</Link>
        </div>
      </div>

      {!requests?.length ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">No requests found</div>
      ) : (
        <div className="space-y-2">
          {requests.map((req: any) => (
            <Link key={req.id} href={`/admin/requests/${req.id}`}
              className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2">
                  <span>{req.categories?.icon}</span>
                  <p className="font-semibold text-stone-900">{req.title}</p>
                </div>
                <p className="text-stone-400 text-xs mt-0.5">
                  {req.users?.email} · {req.amount_needed ? `$${Number(req.amount_needed).toFixed(2)}` : 'Goods'} · {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] ?? 'bg-stone-100 text-stone-600'}`}>
                {req.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
