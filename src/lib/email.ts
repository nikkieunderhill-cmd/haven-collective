import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Haven Collective <no-reply@havencollective.org>'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return // skip in dev if not configured
  await resend.emails.send({ from: FROM, to, subject, html })
}

export const EmailTemplates = {
  applicationReceived: (name: string) => ({
    subject: 'Application received — Haven Collective',
    html: `<p>Hi ${name},</p><p>We've received your application and will review it within 24–48 hours. You'll hear from us as soon as a decision is made.</p><p>Questions? Reply to this email.</p><p>— Haven Collective</p>`,
  }),
  applicationApproved: (name: string) => ({
    subject: 'Your application was approved! — Haven Collective',
    html: `<p>Hi ${name},</p><p>Great news — your application has been approved! You can now log in and post your first request for support.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/recipient/dashboard">Go to your dashboard →</a></p><p>— Haven Collective</p>`,
  }),
  applicationDenied: (name: string, reason: string) => ({
    subject: 'Application update — Haven Collective',
    html: `<p>Hi ${name},</p><p>Unfortunately we weren't able to approve your application at this time.</p><p><strong>Reason:</strong> ${reason}</p><p>You're welcome to reapply if your situation changes. <a href="${process.env.NEXT_PUBLIC_APP_URL}/recipient/onboarding">Resubmit →</a></p><p>— Haven Collective</p>`,
  }),
  requestClaimed: (name: string, requestTitle: string) => ({
    subject: 'Someone is helping you! — Haven Collective',
    html: `<p>Hi ${name},</p><p>A donor has claimed your request "<strong>${requestTitle}</strong>". We'll notify you once payment is complete and the funds are on their way.</p><p>— Haven Collective</p>`,
  }),
  requestFulfilled: (name: string, requestTitle: string) => ({
    subject: 'Your request has been fulfilled — Haven Collective',
    html: `<p>Hi ${name},</p><p>Your request "<strong>${requestTitle}</strong>" has been fulfilled. The funds have been sent to your account.</p><p>— Haven Collective</p>`,
  }),
  claimConfirmed: (amount: number, requestTitle: string) => ({
    subject: 'Claim confirmed — Haven Collective',
    html: `<p>Thanks for claiming "<strong>${requestTitle}</strong>". You have 24 hours to complete your $${amount.toFixed(2)} payment. <a href="${process.env.NEXT_PUBLIC_APP_URL}/donor/history">Complete payment →</a></p><p>— Haven Collective</p>`,
  }),
}
