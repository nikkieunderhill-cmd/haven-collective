import { createClient } from '@/lib/supabase/server'
import ReleaseFundsButton from '@/components/admin/ReleaseFundsButton'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminClaimsPage({ searchParams }: Props) {
  const { filter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('claims')
    .select('*, requests(title, amount_needed, categories(name, icon)), users!donor_id(email)')
    .order('created_at', { ascending: false })

  if (filter === 'paid') query = query.eq('status', 'paid')
  else query = query.in('status', ['pending', 'paid', 'fulfilled', 'lapsed'])

  const { data: claims } = await query.limit(100)

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-blue-100 text-blue-700',
    fulfilled: 'bg-green-100 text-green-700',
    lapsed: 'bg-stone-100 text-stone-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Claims</h1>
        <div className="flex gap-2 text-sm">
          <a href="/admin/claims" className={`px-3 py-1.5 rounded-lg ${!filter ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>All</a>
          <a href="/admin/claims?filter=paid" className={`px-3 py-1.5 rounded-lg ${filter === 'paid' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>Awaiting release</a>
        </div>
      </div>

      <div className="space-y-2">
        {claims?.map((claim: any) => {
          const req = claim.requests
          const cat = req?.categories
          return (
            <div key={claim.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span>{cat?.icon}</span>
                  <p className="font-semibold text-stone-900">{req?.title}</p>
                </div>
                <p className="text-stone-400 text-xs mt-0.5">
                  {claim.users?.email} · ${Number(claim.amount || req?.amount_needed || 0).toFixed(2)} · {new Date(claim.claimed_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[claim.status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {claim.status}
                </span>
                {claim.status === 'paid' && <ReleaseFundsButton claimId={claim.id} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
