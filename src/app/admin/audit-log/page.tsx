import { createClient } from '@/lib/supabase/server'

export default async function AuditLogPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, users!actor_id(email)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Audit Log</h1>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Time</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Actor</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {logs?.map((log: any) => (
              <tr key={log.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-stone-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-stone-600">{log.users?.email ?? 'System'}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-700">{log.action}</td>
                <td className="px-4 py-3 text-stone-400 font-mono text-xs">{log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
