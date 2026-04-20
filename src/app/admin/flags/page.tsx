import { createClient } from '@/lib/supabase/server'
import ResolveFlagButton from '@/components/admin/ResolveFlagButton'

export default async function AdminFlagsPage() {
  const supabase = await createClient()

  const { data: flags } = await supabase
    .from('flags')
    .select('*, users!flagged_by(email)')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Flags</h1>
        <span className="text-stone-500 text-sm">{flags?.filter(f => f.status === 'open').length ?? 0} open</span>
      </div>

      {!flags?.length ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">No flags</div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag: any) => (
            <div key={flag.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
              <div>
                <p className="font-medium text-stone-900 capitalize">{flag.flagged_entity_type} flagged</p>
                <p className="text-stone-500 text-sm mt-0.5">{flag.reason}</p>
                <p className="text-stone-400 text-xs mt-0.5">By {flag.users?.email} · {new Date(flag.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${flag.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'}`}>
                  {flag.status}
                </span>
                {flag.status === 'open' && <ResolveFlagButton flagId={flag.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
