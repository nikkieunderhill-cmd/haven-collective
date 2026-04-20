'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { OnboardingData } from '@/app/recipient/onboarding/page'

const schema = z.object({
  household_size: z.coerce.number().min(1).max(20),
  num_dependents: z.coerce.number().min(0).max(20),
})

type FormData = z.infer<typeof schema>

interface Props {
  data: OnboardingData
  saving: boolean
  onBack: () => void
  onNext: (updates: Partial<OnboardingData>) => void
}

export default function Step2Household({ data, saving, onBack, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Your household</h2>
        <p className="text-stone-500 text-sm">This helps us understand your situation and connect you with the right support.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Total number of people in your household <span className="text-stone-400 font-normal">(including yourself)</span>
        </label>
        <input
          {...register('household_size')}
          type="number"
          min={1}
          max={20}
          className="input w-32"
        />
        {errors.household_size && <p className="text-red-500 text-xs mt-1">{errors.household_size.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Number of dependents <span className="text-stone-400 font-normal">(children or others you care for)</span>
        </label>
        <input
          {...register('num_dependents')}
          type="number"
          min={0}
          max={20}
          className="input w-32"
        />
        {errors.num_dependents && <p className="text-red-500 text-xs mt-1">{errors.num_dependents.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </form>
  )
}
