import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function VettingQueuePage() {
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('recipient_profiles')
    .select(`
      *,
      users (email, created_at)
    `)
    .eq('stripe_identity_verified', true)
    .is('approved_at', null)
    .is('denial_reason', null)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Vetting Queue</h1>
        <span className="text-stone-500 text-sm">{applications?.length ?? 0} pending</span>
      </div>

      {!applications?.length ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
          No applications pending review
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <Link
              key={app.id}
              href={`/admin/vetting/${app.user_id}`}
              className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-stone-900">{app.full_name}</p>
                <p className="text-stone-500 text-sm">{(app.users as any)?.email}</p>
                <p className="text-stone-400 text-xs mt-0.5">
                  {app.city}, {app.state} · {app.household_size} in household · {app.verification_pathway} pathway
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Pending review
                </span>
                <span className="text-stone-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
