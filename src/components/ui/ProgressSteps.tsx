'use client'

interface Step {
  label: string
  number: number
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step.number < currentStep
                ? 'bg-teal-600 text-white'
                : step.number === currentStep
                ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                : 'bg-stone-200 text-stone-500'
            }`}>
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span className={`mt-1 text-xs font-medium hidden sm:block ${
              step.number === currentStep ? 'text-teal-600' : 'text-stone-400'
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mx-1 mb-4 sm:mb-5 transition-colors ${
              step.number < currentStep ? 'bg-teal-600' : 'bg-stone-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}
