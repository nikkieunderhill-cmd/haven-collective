import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, status, reason } = await request.json()

  const { data: targetUser } = await serviceClient.from('users').select('email, stripe_identity_session_id').eq('id', userId).single()

  await serviceClient.from('users').update({ status }).eq('id', userId)

  if (status === 'banned' && targetUser) {
    const emailHash = createHash('sha256').update(targetUser.email.toLowerCase()).digest('hex')
    await serviceClient.from('ban_list').insert({
      email_hash: emailHash,
      stripe_identity_id: targetUser.stripe_identity_session_id ?? null,
      reason: reason ?? 'No reason provided',
      banned_by: user.id,
    })
  }

  await serviceClient.from('audit_log').insert({
    actor_id: user.id,
    action: `user_status_changed_to_${status}`,
    entity_type: 'user',
    entity_id: userId,
    metadata: reason ? { reason } : null,
  })

  return NextResponse.json({ success: true })
}
