import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Generates a simple HTML receipt that the browser can print to PDF
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = new Date().getFullYear() - 1

  const { data: claims } = await supabase
    .from('claims')
    .select('*, requests(title, categories(name))')
    .eq('donor_id', user.id)
    .in('status', ['paid', 'fulfilled'])
    .gte('paid_at', `${year}-01-01`)
    .lte('paid_at', `${year}-12-31`)
    .order('paid_at')

  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  const total = claims?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) ?? 0

  const rows = claims?.map((c: any) => `
    <tr>
      <td>${new Date(c.paid_at).toLocaleDateString()}</td>
      <td>${c.requests?.title ?? '—'}</td>
      <td>${c.requests?.categories?.name ?? '—'}</td>
      <td style="text-align:right">$${Number(c.amount).toFixed(2)}</td>
    </tr>
  `).join('') ?? ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Haven Collective — ${year} Tax Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1c1917; }
    h1 { color: #0d9488; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; border-bottom: 2px solid #e7e5e4; padding: 8px 4px; font-size: 13px; color: #78716c; }
    td { padding: 8px 4px; border-bottom: 1px solid #f5f5f4; font-size: 14px; }
    .total { font-weight: bold; font-size: 16px; margin-top: 16px; text-align: right; }
    .legal { font-size: 12px; color: #78716c; margin-top: 32px; border-top: 1px solid #e7e5e4; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Haven Collective</h1>
  <p><strong>${year} Charitable Contribution Statement</strong></p>
  <p>Donor: ${userData?.email}<br>
  EIN: [PENDING 501(c)(3) APPROVAL]<br>
  Generated: ${new Date().toLocaleDateString()}</p>

  <table>
    <thead><tr><th>Date</th><th>Request</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="color:#78716c">No qualifying contributions found.</td></tr>'}</tbody>
  </table>

  <p class="total">Total contributions: $${total.toFixed(2)}</p>

  <div class="legal">
    <p>Haven Collective is a nonprofit organization. No goods or services were provided in exchange for these contributions.
    This statement is provided for tax purposes. Please retain for your records. Consult a tax advisor for guidance on deductibility.</p>
    <p>Haven Collective · support@havencollective.org</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="haven-collective-${year}-tax-receipt.html"`,
    },
  })
}
