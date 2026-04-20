import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || userData.role !== 'donor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { requestId } = await request.json()

  // Verify request is still active
  const { data: req } = await serviceClient
    .from('requests')
    .select('id, amount_needed, recipient_id, title, status')
    .eq('id', requestId)
    .eq('status', 'active')
    .single()

  if (!req) return NextResponse.json({ error: 'This request is no longer available.' }, { status: 409 })

  // Check donor doesn't already have a pending claim
  const { data: existingClaim } = await serviceClient
    .from('claims')
    .select('id')
    .eq('donor_id', user.id)
    .eq('status', 'pending')
    .single()

  if (existingClaim) return NextResponse.json({ error: 'You already have an active claim.' }, { status: 409 })

  // Create claim and mark request as claimed atomically
  const lapseAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: claim, error } = await serviceClient.from('claims').insert({
    request_id: requestId,
    donor_id: user.id,
    amount: req.amount_needed,
    lapse_at: lapseAt,
    status: 'pending',
  }).select().single()

  if (error || !claim) return NextResponse.json({ error: 'Failed to create claim.' }, { status: 500 })

  await serviceClient.from('requests').update({ status: 'claimed' }).eq('id', requestId)

  // Notify recipient
  await serviceClient.from('notifications').insert({
    user_id: req.recipient_id,
    type: 'request_claimed',
    title: 'Someone is helping you!',
    body: `A donor has claimed your request "${req.title}". You'll be notified when payment is complete.`,
    action_url: `/recipient/requests/${requestId}`,
  })

  await serviceClient.from('audit_log').insert({
    actor_id: user.id,
    action: 'request_claimed',
    entity_type: 'claim',
    entity_id: claim.id,
  })

  // TODO: Create Stripe PaymentIntent when Stripe is connected
  // const paymentIntent = await stripe.paymentIntents.create({ amount: req.amount_needed * 100, currency: 'usd' })
  // await serviceClient.from('claims').update({ payment_intent_id: paymentIntent.id }).eq('id', claim.id)

  return NextResponse.json({ claimId: claim.id })
}
