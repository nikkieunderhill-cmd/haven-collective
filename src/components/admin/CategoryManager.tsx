'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types/database'

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function toggleActive(id: string, isActive: boolean) {
    setSaving(true)
    await fetch('/api/admin/categories/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive }),
    })
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c))
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-stone-900">Categories</h2>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{cat.icon}</span>
              <div>
                <p className="font-medium text-stone-900">{cat.name}</p>
                <p className="text-stone-400 text-xs">
                  {cat.fulfillment_type} · {cat.request_frequency_days}d frequency
                  {cat.funding_cap ? ` · $${cat.funding_cap} cap` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'}`}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleActive(cat.id, cat.is_active)}
                disabled={saving}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {cat.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
