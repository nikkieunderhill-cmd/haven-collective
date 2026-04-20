import { redirect } from 'next/navigation'

// Donors are redirected straight to the feed after signup
// Category preferences are set optionally from settings
export default function DonorOnboardingPage() {
  redirect('/donor/feed')
}
