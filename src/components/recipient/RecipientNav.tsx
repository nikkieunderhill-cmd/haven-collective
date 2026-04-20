import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NotificationBell from '@/components/ui/NotificationBell'

export default async function RecipientNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-stone-900">Haven Collective</span>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/recipient/dashboard" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Home</Link>
          {user && <NotificationBell userId={user.id} />}
          <Link href="/recipient/requests/new" className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors">+ New request</Link>
        </div>
      </div>
    </nav>
  )
}
