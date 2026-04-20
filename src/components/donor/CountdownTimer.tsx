'use client'

import { useState, useEffect } from 'react'

interface Props { lapseAt: string }

export default function CountdownTimer({ lapseAt }: Props) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(lapseAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }

      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${hours}h ${mins}m ${secs}s`)
      setUrgent(diff < 2 * 3600000) // urgent under 2 hours
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [lapseAt])

  return (
    <div className={`text-center p-4 rounded-xl ${urgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${urgent ? 'text-red-500' : 'text-amber-600'}`}>
        Time remaining to pay
      </p>
      <p className={`text-3xl font-bold tabular-nums ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
        {timeLeft}
      </p>
    </div>
  )
}
