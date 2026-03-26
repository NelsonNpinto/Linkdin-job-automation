import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Play, Square, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

const SOCKET_URL = API_URL;

export default function BotControl({ userId }) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ applied: 0, failed: 0, skipped: 0 });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const logsEndRef = useRef(null);
  const socketRef = useRef(null);
  const autoScrollRef = useRef(true);

  const scrollToBottom = () => {
    if (autoScrollRef.current) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    // Check current status
    axios.get(`${API_URL}/api/bot/status/${userId}`).then(res => {
      setRunning(res.data.running);
    }).catch(() => {});

    // Connect socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join-bot', userId);

    socket.on('log', ({ message, type }) => {
      const line = (message || '').trim();
      if (!line) return;

      let logType = 'info';
      if (type === 'error' || line.includes('[ERROR]')) logType = 'error';
      else if (line.includes('[WARN]')) logType = 'warn';
      else if (line.includes('✅') || line.includes('Submitted') || line.includes('Applied')) logType = 'success';

      setLogs(prev => [...prev.slice(-500), { id: Date.now() + Math.random(), text: line, logType }]);

      // Track stats
      if (line.includes('✅ Submitted') || line.includes('Session total:')) {
        setStats(s => ({ ...s, applied: s.applied + (line.includes('✅ Submitted') ? 1 : 0) }));
      }
      if (line.includes('marking as failed') || line.includes('Application unsuccessful')) {
        setStats(s => ({ ...s, failed: s.failed + 1 }));
      }
      if (line.includes('Skipping')) {
        setStats(s => ({ ...s, skipped: s.skipped + 1 }));
      }
    });

    socket.on('bot-stopped', () => {
      setRunning(false);
      setStarting(false);
      setLogs(prev => [
        ...prev,
        { id: Date.now(), text: '─── Bot stopped ───', logType: 'info' },
      ]);
    });

    return () => {
      socket.emit('leave-bot', userId);
      socket.disconnect();
    };
  }, [userId]);

  const startBot = async () => {
    setError('');
    setStarting(true);
    setStats({ applied: 0, failed: 0, skipped: 0 });
    setLogs([{ id: Date.now(), text: '─── Starting bot… ───', logType: 'info' }]);
    try {
      await axios.post(`${API_URL}/api/bot/start/${userId}`);
      setRunning(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start bot');
      setRunning(false);
    }
    setStarting(false);
  };

  const stopBot = async () => {
    await axios.post(`${API_URL}/api/bot/stop/${userId}`).catch(() => {});
    setRunning(false);
  };

  const clearLogs = () => setLogs([]);

  const getLogClass = (type) => {
    switch (type) {
      case 'error':   return 'text-red-400';
      case 'warn':    return 'text-yellow-400';
      case 'success': return 'text-emerald-400';
      default:        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Run Bot</h1>
          <p className="text-sm text-slate-400 mt-0.5">The bot will open a Chrome window on your machine and apply to jobs</p>
        </div>

        <div className="flex items-center gap-3">
          {running && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Running
            </div>
          )}
          <button
            onClick={clearLogs}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            title="Clear logs"
          >
            <Trash2 size={15} />
          </button>
          {running ? (
            <button
              onClick={stopBot}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Square size={14} />
              Stop Bot
            </button>
          ) : (
            <button
              onClick={startBot}
              disabled={starting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Play size={14} />
              {starting ? 'Starting…' : 'Start Bot'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="px-6 py-3 border-b border-slate-700 flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-slate-400">Applied:</span>
          <span className="font-semibold text-emerald-400">{stats.applied}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <XCircle size={14} className="text-red-400" />
          <span className="text-slate-400">Failed:</span>
          <span className="font-semibold text-red-400">{stats.failed}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle size={14} className="text-slate-500" />
          <span className="text-slate-400">Skipped:</span>
          <span className="font-semibold text-slate-500">{stats.skipped}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-slate-500 flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScrollRef.current}
              onChange={e => { autoScrollRef.current = e.target.checked; }}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-y-auto bg-slate-950 px-5 py-4 terminal">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <div className="text-4xl mb-3">🖥️</div>
            <p className="text-sm">Bot logs will appear here</p>
            <p className="text-xs mt-1">Click "Start Bot" to begin</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map(({ id, text, logType }) => (
              <div key={id} className={`${getLogClass(logType)} whitespace-pre-wrap break-all leading-5`}>
                {text}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Tips */}
      {!running && logs.length === 0 && (
        <div className="px-6 py-4 border-t border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-600 font-semibold uppercase mb-2">Before starting</p>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Make sure your LinkedIn credentials are saved in <strong className="text-slate-400">My Profile</strong></li>
            <li>• Add your Groq API key in <strong className="text-slate-400">API Keys</strong> (free at console.groq.com)</li>
            <li>• Configure job keywords and locations in <strong className="text-slate-400">Job Settings</strong></li>
            <li>• A Chrome browser will open on your machine — don't close it while bot is running</li>
            <li>• If LinkedIn asks for verification, complete it manually in the browser window</li>
          </ul>
        </div>
      )}
    </div>
  );
}
