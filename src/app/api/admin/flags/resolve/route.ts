import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { flagId } = await request.json()
  await serviceClient.from('flags').update({ status: 'resolved', resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', flagId)
  return NextResponse.json({ success: true })
}
