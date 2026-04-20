import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ category?: string; sort?: string; min?: string; max?: string }>
}

export default async function DonorFeedPage({ searchParams }: Props) {
  const { category, sort = 'newest', min, max } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .eq('is_active', true)
    .order('name')

  let query = supabase
    .from('requests')
    .select('*, categories(name, icon)')
    .eq('status', 'active')

  if (category) query = query.eq('category_id', category)
  if (min) query = query.gte('amount_needed', Number(min))
  if (max) query = query.lte('amount_needed', Number(max))

  if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'smallest') query = query.order('amount_needed', { ascending: true })

  const { data: requests } = await query.limit(50)

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Browse requests</h1>
        <p className="text-stone-500 text-sm mt-1">Every request is verified. Choose one to fulfill.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/donor/feed" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!category ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
          All
        </Link>
        {categories?.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/donor/feed?category=${cat.id}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat.id ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            {cat.icon} {cat.name}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-stone-500">Sort:</span>
        {[
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Longest waiting' },
          { value: 'smallest', label: 'Smallest amount' },
        ].map(opt => (
          <Link
            key={opt.value}
            href={`/donor/feed?sort=${opt.value}${category ? `&category=${category}` : ''}`}
            className={`px-3 py-1.5 rounded-lg transition-colors ${sort === opt.value ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Request cards */}
      {!requests?.length ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
          No requests available right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <Link
              key={req.id}
              href={`/donor/requests/${req.id}`}
              className="block bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{req.categories?.icon}</span>
                    <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">{req.categories?.name}</span>
                    <span className="ml-auto text-xs text-stone-400">{timeAgo(req.created_at)}</span>
                  </div>
                  <p className="font-semibold text-stone-900 mb-1">{req.title}</p>
                  <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{req.description}</p>
                </div>
                {req.amount_needed && (
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-teal-600">${Number(req.amount_needed).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium">✓ Verified</span>
                <span className="ml-auto text-xs text-teal-600 font-medium">Claim this →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
