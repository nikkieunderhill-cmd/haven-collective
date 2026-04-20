import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const roleRedirects: Record<string, string> = {
      recipient: '/recipient/dashboard',
      donor: '/donor/feed',
      admin: '/admin/dashboard',
      super_admin: '/admin/dashboard',
    }
    redirect(roleRedirects[userData?.role ?? 'donor'])
  }

  redirect('/auth/signup')
}
