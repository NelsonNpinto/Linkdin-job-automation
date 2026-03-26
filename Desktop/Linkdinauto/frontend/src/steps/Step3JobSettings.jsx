import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, X, Plus } from 'lucide-react';
import { API_URL } from '../config';

const DATE_OPTIONS = [
  { label: 'Last 24 hours', value: 'r86400' },
  { label: 'Last 7 days', value: 'r604800' },
  { label: 'Last 30 days', value: 'r2592000' },
];

const EXP_LEVELS = [
  { label: 'Internship', value: '1' },
  { label: 'Entry level', value: '2' },
  { label: 'Associate', value: '3' },
  { label: 'Mid-Senior', value: '4' },
  { label: 'Director', value: '5' },
];

const TagInput = ({ tags, onChange, placeholder, colorClass = 'bg-blue-900/50 text-blue-300 border-blue-700' }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${colorClass}`}>
            {tag}
            <button onClick={() => remove(tag)} className="opacity-60 hover:opacity-100"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={add}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-sm"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default function Step3JobSettings({ config, updateConfig, onNext, onBack }) {
  const [data, setData] = useState({
    jobSearchKeywords: ['Software Engineer', 'Developer'],
    jobLocations: ['India'],
    maxApplicationsPerRun: 10,
    datePostedFilter: 'r2592000',
    experienceLevelFilter: '2,3',
    allowedTitles: ['software engineer', 'developer', 'engineer'],
    blockedTitles: ['salesforce', 'java', 'blockchain', 'wordpress', 'php'],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setData({
        jobSearchKeywords: config.jobSearchKeywords || data.jobSearchKeywords,
        jobLocations: config.jobLocations || data.jobLocations,
        maxApplicationsPerRun: config.maxApplicationsPerRun ?? data.maxApplicationsPerRun,
        datePostedFilter: config.datePostedFilter || data.datePostedFilter,
        experienceLevelFilter: config.experienceLevelFilter || data.experienceLevelFilter,
        allowedTitles: config.allowedTitles || data.allowedTitles,
        blockedTitles: config.blockedTitles || data.blockedTitles,
      });
    }
  }, [config]);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const toggleExpLevel = (val) => {
    const levels = data.experienceLevelFilter.split(',').filter(Boolean);
    const newLevels = levels.includes(val) ? levels.filter(l => l !== val) : [...levels, val];
    set('experienceLevelFilter', newLevels.join(','));
  };

  const handleNext = async () => {
    if (data.jobSearchKeywords.length === 0) {
      alert('Please add at least one job search keyword');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/config`, data);
      updateConfig(data);
      onNext();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  const expLevels = data.experienceLevelFilter.split(',').filter(Boolean);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Step 3: Job Search Settings</h2>
        <p className="text-sm text-slate-400">Configure what jobs the bot will search for and apply to on LinkedIn.</p>
      </div>

      <div className="space-y-5">
        {/* Keywords */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Search Keywords</label>
          <p className="text-xs text-slate-500 mb-3">The bot will search LinkedIn for each keyword separately</p>
          <TagInput
            tags={data.jobSearchKeywords}
            onChange={val => set('jobSearchKeywords', val)}
            placeholder="Add keyword (press Enter)"
          />
        </div>

        {/* Locations */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Job Locations</label>
          <p className="text-xs text-slate-500 mb-3">Where to search for jobs</p>
          <TagInput
            tags={data.jobLocations}
            onChange={val => set('jobLocations', val)}
            placeholder="Add location (e.g. Mumbai, India)"
            colorClass="bg-green-900/50 text-green-300 border-green-800"
          />
        </div>

        {/* Filters */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">Search Filters</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Max Applications Per Run</label>
              <input
                type="number"
                min={1}
                max={100}
                value={data.maxApplicationsPerRun}
                onChange={e => set('maxApplicationsPerRun', Number(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Date Posted</label>
              <select
                value={data.datePostedFilter}
                onChange={e => set('datePostedFilter', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-slate-400 mb-2 block">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {EXP_LEVELS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => toggleExpLevel(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    expLevels.includes(value)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-blue-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Allowed Titles */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Allowed Job Titles (Whitelist)</label>
          <p className="text-xs text-slate-500 mb-3">Bot will ONLY apply if job title contains one of these keywords</p>
          <TagInput
            tags={data.allowedTitles}
            onChange={val => set('allowedTitles', val)}
            placeholder="Add allowed keyword"
            colorClass="bg-emerald-900/50 text-emerald-300 border-emerald-800"
          />
        </div>

        {/* Blocked Titles */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Blocked Job Titles (Blacklist)</label>
          <p className="text-xs text-slate-500 mb-3">Bot will SKIP jobs with these keywords in the title</p>
          <TagInput
            tags={data.blockedTitles}
            onChange={val => set('blockedTitles', val)}
            placeholder="Add blocked keyword"
            colorClass="bg-red-900/50 text-red-300 border-red-900"
          />
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
          onClick={handleNext}
          disabled={saving || data.jobSearchKeywords.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Next'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
