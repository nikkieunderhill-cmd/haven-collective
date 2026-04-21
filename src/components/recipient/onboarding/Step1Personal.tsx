'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { OnboardingData } from '@/app/recipient/(portal)/onboarding/page'

const schema = z.object({
  full_name: z.string().min(2, 'Please enter your full legal name'),
  address: z.string().min(5, 'Please enter your street address'),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().length(2, 'Please use 2-letter state code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  data: OnboardingData
  saving: boolean
  onNext: (updates: Partial<OnboardingData>) => void
}

export default function Step1Personal({ data, saving, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Tell us about yourself</h2>
        <p className="text-stone-500 text-sm">This information is kept confidential and never shared with donors.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Full legal name</label>
        <input {...register('full_name')} className="input" placeholder="Jane Smith" />
        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Street address</label>
        <input {...register('address')} className="input" placeholder="123 Main St" />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
          <input {...register('city')} className="input" placeholder="Los Angeles" />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
          <input {...register('state')} className="input" placeholder="CA" maxLength={2} />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">ZIP code</label>
          <input {...register('zip')} className="input" placeholder="90001" />
          {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Phone <span className="text-stone-400 font-normal">(optional)</span></label>
          <input {...register('phone')} className="input" placeholder="(555) 555-5555" type="tel" />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </form>
  )
}
