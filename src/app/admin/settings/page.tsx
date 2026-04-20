import { createClient } from '@/lib/supabase/server'
import CategoryManager from '@/components/admin/CategoryManager'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('role').eq('id', user!.id).single()

  if (userData?.role !== 'super_admin') {
    return <div className="text-stone-500">Super admin access required.</div>
  }

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
      <CategoryManager initialCategories={categories ?? []} />
    </div>
  )
}
