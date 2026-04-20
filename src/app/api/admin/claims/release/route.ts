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

  const { claimId } = await request.json()

  const { data: claim } = await serviceClient
    .from('claims')
    .select('*, requests(recipient_id, title)')
    .eq('id', claimId)
    .eq('status', 'paid')
    .single()

  if (!claim) return NextResponse.json({ error: 'Claim not found or not in paid status' }, { status: 404 })

  const req = claim.requests as any

  // TODO: Execute Stripe transfer when Stripe is connected
  // await stripe.transfers.create({ amount: claim.amount * 100, currency: 'usd', destination: recipientStripeAccountId })

  await serviceClient.from('claims').update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() }).eq('id', claimId)
  await serviceClient.from('requests').update({ status: 'fulfilled' }).eq('id', claim.request_id)

  await serviceClient.from('notifications').insert([
    {
      user_id: req.recipient_id,
      type: 'request_fulfilled',
      title: 'Funds are on their way!',
      body: `Your request "${req.title}" has been fulfilled. The funds have been sent to your account.`,
      action_url: `/recipient/requests/${claim.request_id}`,
    },
    {
      user_id: claim.donor_id,
      type: 'donation_fulfilled',
      title: 'Your donation made a difference',
      body: `The funds for "${req.title}" have been released to the recipient. Thank you!`,
      action_url: '/donor/history',
    },
  ])

  await serviceClient.from('audit_log').insert({
    actor_id: user.id,
    action: 'funds_released',
    entity_type: 'claim',
    entity_id: claimId,
    metadata: { amount: claim.amount },
  })

  return NextResponse.json({ success: true })
}
