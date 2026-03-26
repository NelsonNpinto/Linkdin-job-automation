import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Play, Eye, EyeOff, ExternalLink, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function Step4ApiKeys({ config, updateConfig, onStart, onBack }) {
  const [groqKey, setGroqKey] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setGroqKey(config.groqApiKey || '');
      setSheetId(config.googleSheetId || '');
    }
  }, [config]);

  const handleStart = async () => {
    if (!groqKey.trim()) {
      alert('Please enter your Groq API key to continue');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/config`, { 
        groqApiKey: groqKey, 
        googleSheetId: sheetId,
        _setupComplete: true 
      });
      updateConfig({ groqApiKey: groqKey, googleSheetId: sheetId, _setupComplete: true });
      onStart();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Step 4: API Keys</h2>
        <p className="text-sm text-slate-400">Set up AI and optional Google Sheets integration. Both are free for your usage.</p>
      </div>

      {/* Cost banner */}
      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
        <p className="text-sm font-semibold text-emerald-400 mb-1">💚 Completely FREE</p>
        <p className="text-xs text-emerald-600">
          Groq offers 14,400 free requests/day. For 10 applications with ~5 AI questions each = ~50 calls, well within the free limit.
        </p>
      </div>

      <div className="space-y-6">
        {/* Groq API Key */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">Groq API Key (Required)</h3>
              <p className="text-xs text-slate-400">Powers the AI that answers application questions using Llama 3.3 70B</p>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 flex-shrink-0"
            >
              Get API Key <ExternalLink size={12} />
            </a>
          </div>

          {/* Step-by-step instructions */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 mb-2">📋 How to get your Groq API Key:</p>
            <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
              <li>Click "Get API Key" above (opens console.groq.com)</li>
              <li>Sign up with Google or GitHub (it's free, no credit card needed)</li>
              <li>Once logged in, click <strong className="text-slate-300">"Create API Key"</strong></li>
              <li>Copy the key (starts with <code className="text-blue-400 bg-slate-900 px-1 rounded">gsk_...</code>)</li>
              <li>Paste it in the field below</li>
            </ol>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Your Groq API Key</label>
            <div className="relative">
              <input
                type={showGroq ? 'text' : 'password'}
                value={groqKey}
                onChange={e => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={() => setShowGroq(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showGroq ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {groqKey && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                <CheckCircle size={12} />
                Key entered
              </div>
            )}
          </div>
        </div>

        {/* Google Sheets (Optional) */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Google Sheets (Optional)</h3>
            <p className="text-xs text-slate-400">Log applied jobs to a Google Sheet. The app tracks history without this, so it's optional.</p>
          </div>

          {/* Instructions */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 mb-2">📋 How to set up Google Sheets (optional):</p>
            <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
              <li>Open <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Sheets</a> and create a new blank sheet</li>
              <li>In the URL bar, copy the Sheet ID (the long string between <code className="text-slate-300">/d/</code> and <code className="text-slate-300">/edit</code>)</li>
              <li>Example: <code className="text-blue-400 bg-slate-900 px-1 rounded text-xs">docs.google.com/spreadsheets/d/<strong>1BxiMVs0XRA5nFMd...</strong>/edit</code></li>
              <li>Paste the ID below</li>
              <li className="text-amber-400">⚠️ You'll also need to set up a Google Cloud service account and credentials.json file (see README for full instructions)</li>
            </ol>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Google Sheet ID (optional)</label>
            <input
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">Leave blank if you don't want Google Sheets logging</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={handleStart}
          disabled={saving || !groqKey.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg"
        >
          <Play size={18} />
          {saving ? 'Starting...' : 'Start Applying'}
        </button>
      </div>
    </div>
  );
}
