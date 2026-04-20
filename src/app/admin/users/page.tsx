import { createClient } from '@/lib/supabase/server'
import UserActions from '@/components/admin/UserActions'

interface Props {
  searchParams: Promise<{ role?: string; status?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { role, status } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)
  if (status) query = query.eq('status', status)

  const { data: users } = await query.limit(100)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Users</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        {['', 'recipient', 'donor', 'admin'].map(r => (
          <a key={r} href={`/admin/users${r ? `?role=${r}` : ''}`}
            className={`px-3 py-1.5 rounded-lg transition-colors ${role === r || (!role && !r) ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {r || 'All'}
          </a>
        ))}
      </div>

      <div className="space-y-2">
        {users?.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
            <div>
              <p className="font-medium text-stone-900">{u.email}</p>
              <p className="text-stone-400 text-xs mt-0.5">
                {u.role} · joined {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                u.status === 'active' ? 'bg-green-100 text-green-700' :
                u.status === 'banned' ? 'bg-red-100 text-red-700' :
                u.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                'bg-stone-100 text-stone-500'
              }`}>{u.status}</span>
              <UserActions userId={u.id} currentStatus={u.status} userEmail={u.email} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
