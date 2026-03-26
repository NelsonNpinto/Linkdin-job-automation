import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, CheckCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';

const Field = ({ label, children, hint }) => (
  <div>
    <label className="text-xs text-slate-400 mb-1.5 block font-medium">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const inputClass = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono';

export default function ApiKeys({ userId }) {
  const [keys, setKeys] = useState({ groqApiKey: '', geminiApiKey: '', googleSheetId: '', googleCredentialsPath: '' });
  const [show, setShow] = useState({ groq: false, gemini: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`/api/users/${userId}`).then(res => {
      const d = res.data;
      setKeys({
        groqApiKey: d.groqApiKey || '',
        geminiApiKey: d.geminiApiKey || '',
        googleSheetId: d.googleSheetId || '',
        googleCredentialsPath: d.googleCredentialsPath || '',
      });
    }).catch(() => {});
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const existing = await axios.get(`/api/users/${userId}`).then(r => r.data).catch(() => ({}));
      await axios.post(`/api/users/${userId}`, { ...existing, ...keys, userId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">API Keys</h1>
          <p className="text-sm text-slate-400 mt-0.5">Keys are stored locally on your machine only</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Cost banner */}
      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-400 mb-1">💚 Both APIs are FREE for your usage</p>
        <p className="text-xs text-emerald-600">Groq: 14,400 free requests/day • Gemini: 1,500 free requests/day<br/>
        For 3–5 users doing 10 jobs/run with ~5 AI questions each = ~500 calls/day — well within free limits.</p>
      </div>

      {/* Groq */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Groq API Key (Primary AI)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Used for answering cover letters and open-ended questions via Llama 3.3 70B</p>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Get key <ExternalLink size={11} />
          </a>
        </div>
        <Field label="Groq API Key">
          <div className="relative">
            <input
              className={inputClass + ' pr-10'}
              type={show.groq ? 'text' : 'password'}
              value={keys.groqApiKey}
              onChange={e => setKeys(k => ({ ...k, groqApiKey: e.target.value }))}
              placeholder="gsk_..."
            />
            <button
              onClick={() => setShow(s => ({ ...s, groq: !s.groq }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {show.groq ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className={`w-2 h-2 rounded-full ${keys.groqApiKey ? 'bg-green-500' : 'bg-slate-600'}`} />
          {keys.groqApiKey ? 'Key entered' : 'Not set'}
        </div>
      </div>

      {/* Gemini */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Gemini API Key (Fallback AI)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Used as fallback if Groq fails — Gemini 2.0 Flash</p>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Get key <ExternalLink size={11} />
          </a>
        </div>
        <Field label="Gemini API Key">
          <div className="relative">
            <input
              className={inputClass + ' pr-10'}
              type={show.gemini ? 'text' : 'password'}
              value={keys.geminiApiKey}
              onChange={e => setKeys(k => ({ ...k, geminiApiKey: e.target.value }))}
              placeholder="AIza..."
            />
            <button
              onClick={() => setShow(s => ({ ...s, gemini: !s.gemini }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {show.gemini ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className={`w-2 h-2 rounded-full ${keys.geminiApiKey ? 'bg-green-500' : 'bg-slate-600'}`} />
          {keys.geminiApiKey ? 'Key entered' : 'Not set (optional but recommended)'}
        </div>
      </div>

      {/* Google Sheets (optional) */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Google Sheets (Optional)</h3>
          <p className="text-xs text-slate-500 mt-0.5">If set, applied jobs are also logged to your Google Sheet. App history works without this.</p>
        </div>
        <Field label="Google Sheet ID" hint="Found in the sheet URL: docs.google.com/spreadsheets/d/SHEET_ID/edit">
          <input
            className={inputClass}
            value={keys.googleSheetId}
            onChange={e => setKeys(k => ({ ...k, googleSheetId: e.target.value }))}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          />
        </Field>
        <Field label="Google Credentials JSON Path" hint="Absolute path to your service account credentials.json file on this machine">
          <input
            className={inputClass}
            value={keys.googleCredentialsPath}
            onChange={e => setKeys(k => ({ ...k, googleCredentialsPath: e.target.value }))}
            placeholder="/Users/you/linkedin-bot/credentials.json"
          />
        </Field>
      </div>

      <div className="flex justify-end pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save API Keys'}
        </button>
      </div>
    </div>
  );
}
