import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, action, reason } = await request.json()

  if (action === 'approve') {
    await serviceClient.from('recipient_profiles').update({
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    }).eq('user_id', userId)

    await serviceClient.from('users').update({ status: 'active' }).eq('id', userId)

    await serviceClient.from('notifications').insert({
      user_id: userId,
      type: 'application_approved',
      title: 'Your application was approved!',
      body: 'Welcome to Haven Collective. You can now post requests for support.',
      action_url: '/recipient/dashboard',
    })
  } else {
    await serviceClient.from('recipient_profiles').update({
      denial_reason: reason,
    }).eq('user_id', userId)

    await serviceClient.from('users').update({ status: 'pending' }).eq('id', userId)

    await serviceClient.from('notifications').insert({
      user_id: userId,
      type: 'application_denied',
      title: 'Application update',
      body: `Your application could not be approved at this time. Reason: ${reason}`,
      action_url: '/recipient/onboarding',
    })
  }

  await serviceClient.from('audit_log').insert({
    actor_id: user.id,
    action: `recipient_application_${action}`,
    entity_type: 'recipient_profile',
    entity_id: userId,
    metadata: action === 'deny' ? { reason } : null,
  })

  return NextResponse.json({ success: true })
}
