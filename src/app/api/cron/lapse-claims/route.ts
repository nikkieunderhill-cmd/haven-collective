import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Called hourly by Vercel Cron — lapses unpaid claims past their 24hr window
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()

  const { data: expiredClaims } = await serviceClient
    .from('claims')
    .select('id, request_id, donor_id, requests(recipient_id, title)')
    .eq('status', 'pending')
    .lt('lapse_at', new Date().toISOString())

  if (!expiredClaims?.length) return NextResponse.json({ lapsed: 0 })

  for (const claim of expiredClaims) {
    const req = claim.requests as any

    await serviceClient.from('claims').update({ status: 'lapsed' }).eq('id', claim.id)
    await serviceClient.from('requests').update({ status: 'active' }).eq('id', claim.request_id)

    // Notify recipient
    if (req?.recipient_id) {
      await serviceClient.from('notifications').insert({
        user_id: req.recipient_id,
        type: 'claim_lapsed',
        title: 'Your request is back in the pool',
        body: `The donor who claimed "${req.title}" didn't complete payment. Your request is active again.`,
        action_url: `/recipient/requests/${claim.request_id}`,
      })
    }

    // Notify donor
    await serviceClient.from('notifications').insert({
      user_id: claim.donor_id,
      type: 'claim_lapsed_donor',
      title: 'Your claim expired',
      body: `Your claim on "${req?.title}" expired. The request has been returned to the pool.`,
      action_url: '/donor/feed',
    })

    await serviceClient.from('audit_log').insert({
      action: 'claim_lapsed',
      entity_type: 'claim',
      entity_id: claim.id,
    })
  }

  return NextResponse.json({ lapsed: expiredClaims.length })
}
