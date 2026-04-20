import Link from 'next/link'

interface Props { userId: string }

export default function DonorNav({ userId }: Props) {
  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-stone-900">Haven Collective</span>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/donor/feed" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">Browse</Link>
          <Link href="/donor/history" className="px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors">My giving</Link>
        </div>
      </div>
    </nav>
  )
}
