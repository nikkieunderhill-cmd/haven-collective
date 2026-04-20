import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: pendingApps },
    { count: pendingRequests },
    { count: pendingClaims },
    { count: openFlags },
  ] = await Promise.all([
    supabase.from('recipient_profiles').select('*', { count: 'exact', head: true })
      .eq('stripe_identity_verified', true)
      .is('approved_at', null)
      .is('denial_reason', null),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const stats = [
    { label: 'Applications to review', value: pendingApps ?? 0, href: '/admin/vetting', color: 'teal' },
    { label: 'Requests to review', value: pendingRequests ?? 0, href: '/admin/requests?filter=pending_review', color: 'blue' },
    { label: 'Payments to release', value: pendingClaims ?? 0, href: '/admin/claims?filter=paid', color: 'green' },
    { label: 'Open flags', value: openFlags ?? 0, href: '/admin/flags', color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}
            className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-stone-500 text-sm mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
