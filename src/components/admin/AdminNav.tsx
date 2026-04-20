import Link from 'next/link'

interface Props {
  role: string
}

export default function AdminNav({ role }: Props) {
  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-stone-900">Haven Collective <span className="text-xs text-stone-400 font-normal ml-1">Admin</span></span>
          <div className="flex items-center gap-1 text-sm">
            <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Dashboard</Link>
            <Link href="/admin/vetting" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Vetting Queue</Link>
            <Link href="/admin/requests" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Requests</Link>
            <Link href="/admin/claims" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Claims</Link>
            <Link href="/admin/users" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Users</Link>
            {role === 'super_admin' && (
              <Link href="/admin/settings" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Settings</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
