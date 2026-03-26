import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

export default function Step1Credentials({ config, updateConfig, onNext }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setEmail(config.linkedinEmail || '');
      setPassword(config.linkedinPassword || '');
    }
  }, [config]);

  const handleNext = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/config`, { linkedinEmail: email, linkedinPassword: password });
      updateConfig({ linkedinEmail: email, linkedinPassword: password });
      onNext();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="glass-card p-responsive space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-responsive-2xl font-semibold text-apple-gray-100">LinkedIn Credentials</h2>
        <p className="text-responsive-sm text-apple-gray-500">Enter your LinkedIn login details. These are stored locally and never shared.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-responsive-sm text-apple-gray-300 mb-2 block font-medium">LinkedIn Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="input-apple"
          />
        </div>

        <div>
          <label className="text-responsive-sm text-apple-gray-300 mb-2 block font-medium">LinkedIn Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="input-apple pr-12"
              onKeyDown={e => e.key === 'Enter' && handleNext()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-gray-500 hover:text-apple-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-apple-blue/10 border border-apple-blue/30 rounded-apple-lg p-4">
        <p className="text-responsive-xs text-apple-blue">
          🔒 <strong>Privacy:</strong> Your credentials are stored locally on your machine only. The bot uses them to log into LinkedIn on your behalf.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={saving || !email.trim() || !password.trim()}
          className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Next'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
