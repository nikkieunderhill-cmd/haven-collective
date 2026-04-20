import { createClient } from '@/lib/supabase/server'

export default async function DonorHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: claims } = await supabase
    .from('claims')
    .select('*, requests(title, amount_needed, categories(name, icon))')
    .eq('donor_id', user!.id)
    .order('created_at', { ascending: false })

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:   { label: 'In progress', color: 'bg-amber-100 text-amber-700' },
    paid:      { label: 'Paid',        color: 'bg-blue-100 text-blue-700' },
    lapsed:    { label: 'Expired',     color: 'bg-stone-100 text-stone-500' },
    fulfilled: { label: 'Fulfilled ✓', color: 'bg-green-100 text-green-700' },
  }

  const totalGiven = claims
    ?.filter(c => ['paid', 'fulfilled'].includes(c.status))
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">My giving</h1>
        {totalGiven > 0 && (
          <p className="text-stone-500 text-sm mt-1">
            You&apos;ve given <span className="font-semibold text-teal-600">${totalGiven.toFixed(2)}</span> to people in your community.
          </p>
        )}
      </div>

      {!claims?.length ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <p className="text-stone-400 mb-4">You haven&apos;t claimed any requests yet.</p>
          <a href="/donor/feed" className="btn-primary inline-block">Browse requests</a>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim: any) => {
            const req = claim.requests
            const cat = req?.categories
            const badge = STATUS_LABELS[claim.status] ?? { label: claim.status, color: 'bg-stone-100 text-stone-500' }
            return (
              <div key={claim.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{cat?.icon}</span>
                    <p className="font-semibold text-stone-900">{req?.title}</p>
                  </div>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {claim.amount ? `$${Number(claim.amount).toFixed(2)}` : 'Goods'} · {new Date(claim.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
