import { User, Search, Key, Bot, History, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const NAV = [
  { id: 'profile',     icon: User,    label: 'My Profile' },
  { id: 'jobsettings', icon: Search,  label: 'Job Settings' },
  { id: 'apikeys',     icon: Key,     label: 'API Keys' },
  { id: 'bot',         icon: Bot,     label: 'Run Bot' },
  { id: 'history',     icon: History, label: 'History' },
];

export default function Sidebar({ page, setPage, users, currentUserId, setCurrentUserId, onNewUser }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentUser = users.find(u => u.userId === currentUserId);

  const deleteUser = async (userId, e) => {
    e.stopPropagation();
    if (!confirm(`Delete user "${userId}"? This cannot be undone.`)) return;
    await axios.delete(`/api/users/${userId}`);
    window.location.reload();
  };

  return (
    <aside className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-lg">🤖</div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">LinkedIn AutoApply</p>
            <p className="text-xs text-slate-500">Powered by Groq + Gemini</p>
          </div>
        </div>
      </div>

      {/* User switcher */}
      <div className="px-3 py-3 border-b border-slate-700">
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-slate-300 truncate flex-1">
            {currentUser?.displayName || 'Select user'}
          </span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {userMenuOpen && (
          <div className="mt-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            {users.map(u => (
              <div
                key={u.userId}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700 transition-colors ${u.userId === currentUserId ? 'bg-slate-700' : ''}`}
                onClick={() => { setCurrentUserId(u.userId); setUserMenuOpen(false); }}
              >
                <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {u.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-slate-300 flex-1 truncate">{u.displayName}</span>
                {users.length > 1 && (
                  <button
                    onClick={(e) => deleteUser(u.userId, e)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => { onNewUser(); setUserMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-blue-400 hover:bg-slate-700 transition-colors text-sm"
            >
              <Plus size={14} />
              Add user
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              page === id
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-600">Runs on your machine • Free for 3–5 users</p>
      </div>
    </aside>
  );
}
