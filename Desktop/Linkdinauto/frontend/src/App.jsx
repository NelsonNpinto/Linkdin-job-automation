import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import Step1Credentials from './steps/Step1Credentials.jsx';
import Step2Profile from './steps/Step2Profile.jsx';
import Step3JobSettings from './steps/Step3JobSettings.jsx';
import Step4ApiKeys from './steps/Step4ApiKeys.jsx';
import LogsPage from './pages/LogsPage.jsx';

export default function App() {
  const [step, setStep] = useState(1);
  const [showLogs, setShowLogs] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/config`).then(res => {
      if (res.data && res.data.linkedinEmail) {
        setConfig(res.data);
        setStep(res.data._setupComplete ? 5 : 1);
      }
    }).catch(() => {});
  }, []);

  const updateConfig = (data) => {
    setConfig(prev => ({ ...prev, ...data }));
  };

  if (showLogs || step === 5) {
    return <LogsPage onBack={() => { setShowLogs(false); setStep(4); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with glassmorphism */}
      <div className="sticky top-0 z-50 glass-card border-b border-apple-border">
        <div className="max-w-4xl mx-auto px-responsive py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-blue-600 rounded-apple flex items-center justify-center text-2xl shadow-apple">
                🤖
              </div>
              <div>
                <h1 className="text-responsive-lg font-semibold text-apple-gray-100">LinkedIn Auto Apply</h1>
                <p className="text-responsive-xs text-apple-gray-500 mt-0.5">Setup your bot in 4 simple steps</p>
              </div>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-apple ${
                      s < step 
                        ? 'bg-apple-green text-white shadow-apple' 
                        : s === step 
                        ? 'bg-apple-blue text-white shadow-apple scale-110' 
                        : 'bg-apple-elevated text-apple-gray-500 border border-apple-border'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  <div className={`hidden sm:block text-[10px] font-medium ${
                    s === step ? 'text-apple-blue' : 'text-apple-gray-600'
                  }`}>
                    {s === 1 ? 'Login' : s === 2 ? 'Profile' : s === 3 ? 'Jobs' : 'Keys'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content with responsive padding */}
      <div className="flex-1 overflow-y-auto py-responsive">
        <div className="max-w-4xl mx-auto px-responsive">
          <div className="transition-apple">
            {step === 1 && <Step1Credentials config={config} updateConfig={updateConfig} onNext={() => setStep(2)} />}
            {step === 2 && <Step2Profile config={config} updateConfig={updateConfig} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <Step3JobSettings config={config} updateConfig={updateConfig} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <Step4ApiKeys config={config} updateConfig={updateConfig} onStart={() => setShowLogs(true)} onBack={() => setStep(3)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
