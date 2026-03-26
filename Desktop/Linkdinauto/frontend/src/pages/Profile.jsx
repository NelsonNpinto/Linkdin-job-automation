import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Eye, EyeOff, CheckCircle } from 'lucide-react';

const DEFAULT_PROFILE = {
  displayName: '',
  linkedinEmail: '',
  linkedinPassword: '',
  profile: {
    name: '',
    currentRole: '',
    experienceYears: 2,
    phone: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    noticePeriodDays: 30,
    expectedSalary: '',
    currentSalary: '',
    workPreference: 'Hybrid',
    willingToRelocate: 'Yes',
    authorizedToWork: 'Yes',
    requireSponsorship: 'No',
    education: '',
    languages: 'English',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    gender: 'Male',
    veteran: 'No',
    disability: 'No',
    resumeSummary: '',
  },
};

const Section = ({ title, children }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children, hint }) => (
  <div>
    <label className="text-xs text-slate-400 mb-1.5 block font-medium">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
  </div>
);

const inputClass = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
const selectClass = inputClass;

export default function Profile({ userId }) {
  const [data, setData] = useState(DEFAULT_PROFILE);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`/api/users/${userId}`).then(res => {
      const merged = { ...DEFAULT_PROFILE, ...res.data };
      merged.profile = { ...DEFAULT_PROFILE.profile, ...(res.data.profile || {}) };
      setData(merged);
    }).catch(() => {});
  }, [userId]);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));
  const setP = (key, val) => setData(d => ({ ...d, profile: { ...d.profile, [key]: val } }));

  const buildSkillExperience = (years) => {
    const skills = [
      'react native','react','reactjs','react.js','javascript','typescript',
      'node','node.js','nodejs','python','aws','mongodb','firebase','redux',
      'html','html5','css','css3','next.js','nextjs','express','express.js',
      'graphql','docker','sql','postgresql','postgres','mysql','tailwind',
      'tailwindcss','git','github','rest api','rest apis','restful','ios',
      'android','flutter','vue','angular','fastapi','openai','gen ai','ai',
      'jest','ci/cd','jira','figma','material ui','google cloud','gcp',
      'saas','mern','fullstack','full stack',
    ];
    return Object.fromEntries(skills.map(s => [s, { years: Number(years) || 1, months: 0 }]));
  };

  const save = async () => {
    setSaving(true);
    try {
      const existing = await axios.get(`/api/users/${userId}`).then(r => r.data).catch(() => ({}));
      const profileWithSkills = {
        ...data.profile,
        skillExperience: buildSkillExperience(data.profile.experienceYears),
      };
      await axios.post(`/api/users/${userId}`, { ...existing, ...data, profile: profileWithSkills, userId });
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
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <p className="text-sm text-slate-400 mt-0.5">Your info is used by the bot to fill out job applications</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* LinkedIn Credentials */}
      <Section title="LinkedIn Credentials">
        <Field label="Display Name (for this app only)">
          <input className={inputClass} value={data.displayName} onChange={e => set('displayName', e.target.value)} placeholder="e.g. John Doe" />
        </Field>
        <Field label="LinkedIn Email">
          <input className={inputClass} type="email" value={data.linkedinEmail} onChange={e => set('linkedinEmail', e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="LinkedIn Password">
          <div className="relative">
            <input
              className={inputClass + ' pr-10'}
              type={showPassword ? 'text' : 'password'}
              value={data.linkedinPassword}
              onChange={e => set('linkedinPassword', e.target.value)}
              placeholder="Your LinkedIn password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
      </Section>

      {/* Personal Info */}
      <Section title="Personal Information">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name">
            <input className={inputClass} value={data.profile.name} onChange={e => setP('name', e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Current Role">
            <input className={inputClass} value={data.profile.currentRole} onChange={e => setP('currentRole', e.target.value)} placeholder="React Native Developer" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number">
            <input className={inputClass} value={data.profile.phone} onChange={e => setP('phone', e.target.value)} placeholder="9834350501" />
          </Field>
          <Field label="Total Experience (years)">
            <input className={inputClass} type="number" value={data.profile.experienceYears} onChange={e => setP('experienceYears', Number(e.target.value))} placeholder="2" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input className={inputClass} value={data.profile.city} onChange={e => setP('city', e.target.value)} placeholder="Mumbai" />
          </Field>
          <Field label="State">
            <input className={inputClass} value={data.profile.state} onChange={e => setP('state', e.target.value)} placeholder="Maharashtra" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <input className={inputClass} value={data.profile.country} onChange={e => setP('country', e.target.value)} placeholder="India" />
          </Field>
          <Field label="Pin / Postal Code">
            <input className={inputClass} value={data.profile.pinCode} onChange={e => setP('pinCode', e.target.value)} placeholder="400001" />
          </Field>
        </div>
      </Section>

      {/* Work Preferences */}
      <Section title="Work Preferences">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current Salary (LPA)">
            <input className={inputClass} type="number" value={data.profile.currentSalary} onChange={e => setP('currentSalary', e.target.value)} placeholder="6" />
          </Field>
          <Field label="Expected Salary (LPA)">
            <input className={inputClass} type="number" value={data.profile.expectedSalary} onChange={e => setP('expectedSalary', e.target.value)} placeholder="13" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Notice Period (days)">
            <input className={inputClass} type="number" value={data.profile.noticePeriodDays} onChange={e => setP('noticePeriodDays', Number(e.target.value))} placeholder="30" />
          </Field>
          <Field label="Work Preference">
            <select className={selectClass} value={data.profile.workPreference} onChange={e => setP('workPreference', e.target.value)}>
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Willing to Relocate">
            <select className={selectClass} value={data.profile.willingToRelocate} onChange={e => setP('willingToRelocate', e.target.value)}>
              <option>Yes</option>
              <option>No</option>
            </select>
          </Field>
          <Field label="Authorized to Work">
            <select className={selectClass} value={data.profile.authorizedToWork} onChange={e => setP('authorizedToWork', e.target.value)}>
              <option>Yes</option>
              <option>No</option>
            </select>
          </Field>
          <Field label="Require Sponsorship">
            <select className={selectClass} value={data.profile.requireSponsorship} onChange={e => setP('requireSponsorship', e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Education & Languages */}
      <Section title="Education & Languages">
        <Field label="Education" hint="e.g. Bachelor of Science in IT, XYZ College (CGPA: 8.5)">
          <input className={inputClass} value={data.profile.education} onChange={e => setP('education', e.target.value)} placeholder="Bachelor of Science in IT..." />
        </Field>
        <Field label="Languages">
          <input className={inputClass} value={data.profile.languages} onChange={e => setP('languages', e.target.value)} placeholder="English, Hindi" />
        </Field>
      </Section>

      {/* Links */}
      <Section title="Links">
        <Field label="LinkedIn Profile URL">
          <input className={inputClass} value={data.profile.linkedinUrl} onChange={e => setP('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Portfolio / Website">
            <input className={inputClass} value={data.profile.portfolioUrl} onChange={e => setP('portfolioUrl', e.target.value)} placeholder="https://yourportfolio.com" />
          </Field>
          <Field label="GitHub">
            <input className={inputClass} value={data.profile.githubUrl} onChange={e => setP('githubUrl', e.target.value)} placeholder="https://github.com/yourusername" />
          </Field>
        </div>
      </Section>

      {/* Diversity */}
      <Section title="Diversity (optional — some apps ask these)">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Gender">
            <select className={selectClass} value={data.profile.gender} onChange={e => setP('gender', e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
          <Field label="Veteran">
            <select className={selectClass} value={data.profile.veteran} onChange={e => setP('veteran', e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
          <Field label="Disability">
            <select className={selectClass} value={data.profile.disability} onChange={e => setP('disability', e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Resume */}
      <Section title="Resume Summary (used by AI for cover letters & open-ended questions)">
        <Field label="Paste your resume text" hint="The AI uses this to answer 'tell us about yourself' and cover letter fields">
          <textarea
            className={inputClass + ' min-h-48 resize-y'}
            value={data.profile.resumeSummary}
            onChange={e => setP('resumeSummary', e.target.value)}
            placeholder="Paste your full resume text here..."
          />
        </Field>
      </Section>

      <div className="flex justify-end pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
