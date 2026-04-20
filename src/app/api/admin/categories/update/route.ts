import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const { id, ...updates } = body
  await serviceClient.from('categories').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}
