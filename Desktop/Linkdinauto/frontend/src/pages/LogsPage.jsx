import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Square, Trash2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const SOCKET_URL = API_URL;

export default function LogsPage({ onBack }) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ applied: 0, failed: 0, skipped: 0 });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const logsEndRef = useRef(null);
  const socketRef = useRef(null);
  const autoScrollRef = useRef(true);
  const hasStartedRef = useRef(false);

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
    axios.get(`${API_URL}/api/bot/status`).then(res => {
      setRunning(res.data.running);
    }).catch(() => {});

    // Connect socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join-bot');

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

    // Auto-start bot when page loads
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startBot();
    }

    return () => {
      socket.emit('leave-bot');
      socket.disconnect();
    };
  }, []);

  const startBot = async () => {
    setError('');
    setStarting(true);
    setStats({ applied: 0, failed: 0, skipped: 0 });
    setLogs([{ id: Date.now(), text: '─── Starting bot… ───', logType: 'info' }]);
    try {
      await axios.post(`${API_URL}/api/bot/start`);
      setRunning(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start bot');
      setRunning(false);
    }
    setStarting(false);
  };

  const stopBot = async () => {
    await axios.post(`${API_URL}/api/bot/stop`).catch(() => {});
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
    <div className="flex flex-col h-screen">
      {/* Header with glassmorphism */}
      <div className="glass-card border-b border-apple-border flex-shrink-0">
        <div className="px-responsive py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={onBack}
                className="p-2 text-apple-gray-400 hover:text-apple-gray-200 hover:bg-apple-elevated rounded-apple transition-apple"
                title="Back to setup"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-responsive-lg font-semibold text-apple-gray-100">Bot Running</h1>
                <p className="text-responsive-xs text-apple-gray-500 mt-0.5">A Chrome window will open on your machine</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {running && (
                <div className="flex items-center gap-2 text-responsive-sm text-apple-green">
                  <div className="w-2 h-2 rounded-full bg-apple-green animate-pulse shadow-apple" />
                  Running
                </div>
              )}
              <button
                onClick={clearLogs}
                className="p-2 text-apple-gray-500 hover:text-apple-gray-300 hover:bg-apple-elevated rounded-apple transition-apple"
                title="Clear logs"
              >
                <Trash2 size={16} />
              </button>
              {running ? (
                <button
                  onClick={stopBot}
                  className="flex items-center gap-2 px-5 py-2.5 bg-apple-red hover:bg-opacity-90 text-white rounded-full text-responsive-sm font-medium transition-apple shadow-apple"
                >
                  <Square size={14} />
                  <span className="hidden sm:inline">Stop Bot</span>
                  <span className="sm:hidden">Stop</span>
                </button>
              ) : (
                <button
                  onClick={startBot}
                  disabled={starting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-apple-blue hover:bg-opacity-90 disabled:opacity-50 text-white rounded-full text-responsive-sm font-medium transition-apple shadow-apple"
                >
                  <span className="hidden sm:inline">{starting ? 'Starting…' : 'Restart Bot'}</span>
                  <span className="sm:hidden">{starting ? 'Start…' : 'Restart'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-responsive mt-4 flex items-start gap-2 bg-apple-red/10 border border-apple-red/30 rounded-apple-lg px-4 py-3 text-responsive-sm text-apple-red">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="glass-card border-b border-apple-border flex-shrink-0">
        <div className="px-responsive py-3 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-responsive-sm">
            <CheckCircle2 size={14} className="text-apple-green" />
            <span className="text-apple-gray-400">Applied:</span>
            <span className="font-semibold text-apple-green">{stats.applied}</span>
          </div>
          <div className="flex items-center gap-2 text-responsive-sm">
            <XCircle size={14} className="text-apple-red" />
            <span className="text-apple-gray-400">Failed:</span>
            <span className="font-semibold text-apple-red">{stats.failed}</span>
          </div>
          <div className="flex items-center gap-2 text-responsive-sm">
            <AlertCircle size={14} className="text-apple-gray-500" />
            <span className="text-apple-gray-400">Skipped:</span>
            <span className="font-semibold text-apple-gray-500">{stats.skipped}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-responsive-xs text-apple-gray-500 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScrollRef.current}
                onChange={e => { autoScrollRef.current = e.target.checked; }}
                className="w-4 h-4 rounded accent-apple-blue"
              />
              Auto-scroll
            </label>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-y-auto bg-black/50 backdrop-blur-sm px-responsive py-4 terminal">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-apple-gray-600">
            <div className="text-5xl sm:text-6xl mb-4">🖥️</div>
            <p className="text-responsive-sm font-medium">Starting bot...</p>
            <p className="text-responsive-xs mt-2">Logs will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(({ id, text, logType }) => (
              <div key={id} className={`${getLogClass(logType)} whitespace-pre-wrap break-all leading-relaxed`}>
                {text}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Tips */}
      {!running && logs.length === 0 && (
        <div className="glass-card border-t border-apple-border flex-shrink-0">
          <div className="px-responsive py-4">
            <p className="text-responsive-xs text-apple-gray-600 font-semibold uppercase mb-3 tracking-wider">Tips</p>
            <ul className="space-y-2 text-responsive-xs text-apple-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-apple-blue mt-0.5">•</span>
                <span>A Chrome browser will open automatically — don't close it while bot is running</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-apple-blue mt-0.5">•</span>
                <span>If LinkedIn asks for verification, complete it manually in the browser window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-apple-blue mt-0.5">•</span>
                <span>The bot will apply to jobs based on your settings from the previous steps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-apple-blue mt-0.5">•</span>
                <span>You can stop the bot anytime using the "Stop Bot" button above</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
