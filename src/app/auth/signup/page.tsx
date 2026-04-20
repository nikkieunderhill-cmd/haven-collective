'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<'recipient' | 'donor' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (role === 'recipient') {
      router.push('/recipient/onboarding')
    } else {
      router.push('/donor/onboarding')
    }
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-stone-900">Haven Collective</h1>
            <p className="text-stone-500 mt-2 text-lg">A safe place to give and receive help</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => { setRole('recipient'); setStep('details') }}
              className="group bg-white border-2 border-stone-200 hover:border-teal-400 rounded-2xl p-8 text-left transition-all shadow-sm hover:shadow-md"
            >
              <div className="text-4xl mb-4">🤝</div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">I need help</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Apply to receive support from donors in your community. Your identity is kept private.
              </p>
            </button>

            <button
              onClick={() => { setRole('donor'); setStep('details') }}
              className="group bg-white border-2 border-stone-200 hover:border-teal-400 rounded-2xl p-8 text-left transition-all shadow-sm hover:shadow-md"
            >
              <div className="text-4xl mb-4">💛</div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">I want to help</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Browse vetted requests and make a real difference for someone in your community.
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-teal-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Create your account</h1>
          <p className="text-stone-500 mt-2">
            {role === 'recipient' ? 'Apply for support' : 'Start giving'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <button
            onClick={() => setStep('role')}
            className="mt-4 w-full text-center text-sm text-stone-500 hover:text-stone-700"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
