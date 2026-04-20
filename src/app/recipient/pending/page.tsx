export default function PendingPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">📬</div>
        <h1 className="text-2xl font-bold text-stone-900 mb-3">Application received</h1>
        <p className="text-stone-500 leading-relaxed mb-6">
          Thank you for applying. Our team reviews every application carefully and will get back to
          you within <strong>24–48 hours</strong>. You&apos;ll receive an email as soon as a decision is made.
        </p>
        <p className="text-sm text-stone-400">
          Questions? Email us at{' '}
          <a href="mailto:support@havencollective.org" className="text-teal-600 hover:underline">
            support@havencollective.org
          </a>
        </p>
      </div>
    </div>
  )
}
