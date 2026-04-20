import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecipientNav from '@/components/recipient/RecipientNav'

export default async function RecipientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'recipient') redirect('/')

  if (userData.status === 'pending') redirect('/recipient/pending')

  return (
    <div className="min-h-screen bg-stone-50">
      <RecipientNav />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
