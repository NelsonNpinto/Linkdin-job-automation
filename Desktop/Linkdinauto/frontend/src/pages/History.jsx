import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Trash2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function History({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/history/${userId}`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const clearHistory = async () => {
    if (!confirm('Clear all history for this user?')) return;
    await axios.delete(`/api/history/${userId}`).catch(() => {});
    setHistory([]);
  };

  const filtered = filter === 'All' ? history : history.filter(h => h.status === filter);

  const counts = {
    All: history.length,
    Applied: history.filter(h => h.status === 'Applied').length,
    Failed: history.filter(h => h.status === 'Failed').length,
  };

  const StatusBadge = ({ status }) => {
    if (status === 'Applied') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800">
        <CheckCircle2 size={10} /> Applied
      </span>
    );
    if (status === 'Failed') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-900/50 text-red-400 border border-red-900">
        <XCircle size={10} /> Failed
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400 border border-slate-600">
        <Clock size={10} /> {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Application History</h1>
          <p className="text-sm text-slate-400 mt-0.5">{history.length} total applications tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-900/30 border border-red-900/50 hover:border-red-700 rounded-lg text-sm transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats + filter */}
      <div className="px-6 py-3 border-b border-slate-700 flex items-center gap-3 flex-shrink-0">
        {['All', 'Applied', 'Failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {f} <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <div className="text-4xl">📋</div>
            <p className="text-sm">No applications yet</p>
            <p className="text-xs">Run the bot to start applying. Your history will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">AI</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3 text-slate-300 font-medium max-w-[160px] truncate">{item.company}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{item.role}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{item.location}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.aiUsed || '—'}</td>
                  <td className="px-4 py-3">
                    {item.jobUrl && (
                      <a
                        href={item.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
