import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  const { email, stripeIdentityId } = await request.json()
  const serviceClient = await createServiceClient()

  const emailHash = createHash('sha256').update(email.toLowerCase()).digest('hex')

  const { data: banned } = await serviceClient
    .from('ban_list')
    .select('id, reason')
    .or(`email_hash.eq.${emailHash}${stripeIdentityId ? `,stripe_identity_id.eq.${stripeIdentityId}` : ''}`)
    .limit(1)
    .single()

  return NextResponse.json({ banned: !!banned, reason: banned?.reason })
}
