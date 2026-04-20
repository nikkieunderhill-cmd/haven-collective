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

  const { requestId, action, reason } = await request.json()

  const { data: req } = await serviceClient.from('requests').select('recipient_id, title').eq('id', requestId).single()
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    await serviceClient.from('requests').update({
      status: 'active',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq('id', requestId)

    await serviceClient.from('notifications').insert({
      user_id: req.recipient_id,
      type: 'request_approved',
      title: 'Your request is now live!',
      body: `"${req.title}" has been approved and is now visible to donors.`,
      action_url: `/recipient/requests/${requestId}`,
    })
  } else {
    await serviceClient.from('requests').update({
      status: 'denied',
      denial_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq('id', requestId)

    await serviceClient.from('notifications').insert({
      user_id: req.recipient_id,
      type: 'request_denied',
      title: 'Request update',
      body: `Your request "${req.title}" could not be approved. Reason: ${reason}`,
      action_url: '/recipient/requests/new',
    })
  }

  await serviceClient.from('audit_log').insert({
    actor_id: user.id,
    action: `request_${action}`,
    entity_type: 'request',
    entity_id: requestId,
    metadata: action === 'deny' ? { reason } : null,
  })

  return NextResponse.json({ success: true })
}
