import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { API_URL } from '../config';

export default function Step2Profile({ config, updateConfig, onNext, onBack }) {
  const [data, setData] = useState({
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
    resumeSummary: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config?.profile) {
      setData({ ...data, ...config.profile });
    }
  }, [config]);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const handleNext = async () => {
    if (!data.name.trim() || !data.phone.trim()) {
      alert('Please fill in at least your name and phone number');
      return;
    }
    setSaving(true);
    try {
      const skills = [
        'react native','react','reactjs','javascript','typescript','node','nodejs',
        'python','aws','mongodb','firebase','redux','html','css','express',
        'graphql','docker','sql','postgresql','mysql','tailwind','git','github',
        'rest api','ios','android','flutter','vue','angular','fastapi','ai',
        'jest','ci/cd','jira','figma','mern','fullstack',
      ];
      const skillExperience = Object.fromEntries(skills.map(s => [s, { years: Number(data.experienceYears) || 1, months: 0 }]));
      
      await axios.post(`${API_URL}/api/config`, { profile: { ...data, skillExperience } });
      updateConfig({ profile: { ...data, skillExperience } });
      onNext();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    }
    setSaving(false);
  };

  return (
    <div className="glass-card p-responsive space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h2 className="text-responsive-2xl font-semibold text-apple-gray-100">Your Profile</h2>
        <p className="text-responsive-sm text-apple-gray-500">Fill in your details. The bot will use this info to auto-fill job applications.</p>
      </div>

      <div className="bg-apple-orange/10 border border-apple-orange/30 rounded-apple-lg p-4 flex items-start gap-3">
        <Info size={16} className="text-apple-orange flex-shrink-0 mt-0.5" />
        <p className="text-responsive-xs text-apple-orange">
          <strong>Tip:</strong> Most of this info is already on your LinkedIn profile. The bot will try to auto-fill from LinkedIn when possible, but having it here ensures accuracy.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-responsive-sm font-semibold text-apple-gray-300 mb-4 uppercase tracking-wider">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Full Name *</label>
              <input className="input-apple" value={data.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Current Role</label>
              <input className="input-apple" value={data.currentRole} onChange={e => set('currentRole', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Phone Number *</label>
              <input className="input-apple" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Total Experience (years)</label>
              <input className="input-apple" type="number" value={data.experienceYears} onChange={e => set('experienceYears', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-responsive-sm font-semibold text-apple-gray-300 mb-4 uppercase tracking-wider">Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">City</label>
              <input className="input-apple" value={data.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">State</label>
              <input className="input-apple" value={data.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Country</label>
              <input className="input-apple" value={data.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Pin Code</label>
              <input className="input-apple" value={data.pinCode} onChange={e => set('pinCode', e.target.value)} placeholder="400001" />
            </div>
          </div>
        </div>

        {/* Work Preferences */}
        <div>
          <h3 className="text-responsive-sm font-semibold text-apple-gray-300 mb-4 uppercase tracking-wider">Work Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Current Salary (LPA)</label>
              <input className="input-apple" type="number" value={data.currentSalary} onChange={e => set('currentSalary', e.target.value)} placeholder="6" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Expected Salary (LPA)</label>
              <input className="input-apple" type="number" value={data.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} placeholder="10" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Notice Period (days)</label>
              <input className="input-apple" type="number" value={data.noticePeriodDays} onChange={e => set('noticePeriodDays', e.target.value)} />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Work Preference</label>
              <select className="input-apple" value={data.workPreference} onChange={e => set('workPreference', e.target.value)}>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
            </div>
          </div>
        </div>

        {/* Education & Links */}
        <div>
          <h3 className="text-responsive-sm font-semibold text-apple-gray-300 mb-4 uppercase tracking-wider">Education & Links</h3>
          <div className="space-y-4">
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Education</label>
              <input className="input-apple" value={data.education} onChange={e => set('education', e.target.value)} placeholder="B.Tech in Computer Science, XYZ University" />
            </div>
            <div>
              <label className="text-responsive-xs text-apple-gray-400 mb-2 block">LinkedIn Profile URL</label>
              <input className="input-apple" value={data.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Portfolio URL</label>
                <input className="input-apple" value={data.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} placeholder="https://yoursite.com" />
              </div>
              <div>
                <label className="text-responsive-xs text-apple-gray-400 mb-2 block">GitHub URL</label>
                <input className="input-apple" value={data.githubUrl} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/you" />
              </div>
            </div>
          </div>
        </div>

        {/* Resume */}
        <div>
          <h3 className="text-responsive-sm font-semibold text-apple-gray-300 mb-4 uppercase tracking-wider">Resume Summary</h3>
          <label className="text-responsive-xs text-apple-gray-400 mb-2 block">Paste your resume text (used by AI for cover letters)</label>
          <textarea
            className="input-apple min-h-32 resize-y"
            value={data.resumeSummary}
            onChange={e => set('resumeSummary', e.target.value)}
            placeholder="Experienced software engineer with 3+ years in full-stack development..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <button
          onClick={onBack}
          className="btn-apple-secondary flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={saving || !data.name.trim() || !data.phone.trim()}
          className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : 'Next'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
