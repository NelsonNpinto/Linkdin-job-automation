import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, CheckCircle, X, Plus } from 'lucide-react';

const DEFAULT_SETTINGS = {
  jobSearchKeywords: ['React Native Developer', 'React Native Engineer', 'React Developer'],
  jobLocations: ['India'],
  maxApplicationsPerRun: 10,
  datePostedFilter: 'r2592000',
  experienceLevelFilter: '2,3',
  allowedTitles: [
    'react native', 'mobile developer', 'mobile engineer', 'react developer',
    'react engineer', 'frontend developer', 'software engineer', 'software developer',
    'fullstack', 'full stack', 'javascript', 'web developer',
  ],
  blockedTitles: ['salesforce', 'java', 'blockchain', 'wordpress', 'php', 'devops', 'data engineer'],
};

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

const Section = ({ title, desc, children }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
      {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

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
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={add}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-sm"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default function JobSettings({ userId }) {
  const [data, setData] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`/api/users/${userId}`).then(res => {
      const d = res.data;
      setData({
        jobSearchKeywords: d.jobSearchKeywords || DEFAULT_SETTINGS.jobSearchKeywords,
        jobLocations: d.jobLocations || DEFAULT_SETTINGS.jobLocations,
        maxApplicationsPerRun: d.maxApplicationsPerRun ?? DEFAULT_SETTINGS.maxApplicationsPerRun,
        datePostedFilter: d.datePostedFilter || DEFAULT_SETTINGS.datePostedFilter,
        experienceLevelFilter: d.experienceLevelFilter || DEFAULT_SETTINGS.experienceLevelFilter,
        allowedTitles: d.allowedTitles || DEFAULT_SETTINGS.allowedTitles,
        blockedTitles: d.blockedTitles || DEFAULT_SETTINGS.blockedTitles,
      });
    }).catch(() => {});
  }, [userId]);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const toggleExpLevel = (val) => {
    const levels = data.experienceLevelFilter.split(',').filter(Boolean);
    const newLevels = levels.includes(val) ? levels.filter(l => l !== val) : [...levels, val];
    set('experienceLevelFilter', newLevels.join(','));
  };

  const save = async () => {
    setSaving(true);
    try {
      const existing = await axios.get(`/api/users/${userId}`).then(r => r.data).catch(() => ({}));
      await axios.post(`/api/users/${userId}`, { ...existing, ...data, userId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  const expLevels = data.experienceLevelFilter.split(',').filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Job Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure what jobs the bot searches and applies to</p>
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

      {/* Search keywords */}
      <Section title="Search Keywords" desc="The bot searches LinkedIn for each keyword separately">
        <TagInput
          tags={data.jobSearchKeywords}
          onChange={val => set('jobSearchKeywords', val)}
          placeholder="Add keyword (press Enter)"
        />
      </Section>

      {/* Locations */}
      <Section title="Job Locations" desc="Where to search for jobs">
        <TagInput
          tags={data.jobLocations}
          onChange={val => set('jobLocations', val)}
          placeholder="Add location (e.g. Mumbai, India)"
          colorClass="bg-green-900/50 text-green-300 border-green-800"
        />
      </Section>

      {/* Filters */}
      <Section title="Search Filters">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Max Applications Per Run</label>
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
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Date Posted</label>
            <select
              value={data.datePostedFilter}
              onChange={e => set('datePostedFilter', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block font-medium">Experience Level</label>
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
      </Section>

      {/* Allowed Titles */}
      <Section title="Allowed Job Titles (Whitelist)" desc="Bot will ONLY apply if job title contains one of these">
        <TagInput
          tags={data.allowedTitles}
          onChange={val => set('allowedTitles', val)}
          placeholder="Add allowed title keyword"
          colorClass="bg-emerald-900/50 text-emerald-300 border-emerald-800"
        />
      </Section>

      {/* Blocked Titles */}
      <Section title="Blocked Job Titles (Blacklist)" desc="Bot will SKIP jobs with these in the title">
        <TagInput
          tags={data.blockedTitles}
          onChange={val => set('blockedTitles', val)}
          placeholder="Add blocked title keyword"
          colorClass="bg-red-900/50 text-red-300 border-red-900"
        />
      </Section>

      <div className="flex justify-end pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
