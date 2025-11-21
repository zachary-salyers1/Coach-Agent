import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Target, Briefcase, Mountain } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    businessName: '',
    industry: '',
    mainGoal: '',
    biggestChallenge: '',
  });

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete({
        businessName: formData.businessName || 'My Business',
        industry: formData.industry || 'General',
        mainGoal: formData.mainGoal || 'Grow',
        biggestChallenge: formData.biggestChallenge || 'Time',
        isSetup: true,
      });
    }
  };

  const isStepValid = () => {
    if (step === 1) return !!formData.businessName;
    if (step === 2) return !!formData.industry;
    if (step === 3) return !!formData.mainGoal;
    if (step === 4) return !!formData.biggestChallenge;
    return false;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full mb-8">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-emerald-400' : 'bg-slate-800'}`} 
            />
          ))}
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
          {step === 1 && "Let's start with the basics."}
          {step === 2 && "What industry are you in?"}
          {step === 3 && "What is your main goal?"}
          {step === 4 && "What's holding you back?"}
        </h1>
        <p className="text-slate-400 animate-fade-in">
          {step === 1 && "What is the name of your business?"}
          {step === 2 && "This helps me tailor my advice."}
          {step === 3 && "Be specific. e.g., 'Reach $10k MRR'"}
          {step === 4 && "e.g., 'Procrastination', 'Marketing', 'Sales'"}
        </p>
      </div>

      <div className="w-full flex-1 flex flex-col justify-center animate-slide-up">
        {step === 1 && (
          <div className="relative">
            <Briefcase className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Business Name"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className="relative">
            <Briefcase className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="e.g. SaaS, E-commerce, Coaching"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="relative">
            <Target className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input
              type="text"
              value={formData.mainGoal}
              onChange={(e) => handleChange('mainGoal', e.target.value)}
              placeholder="Your primary objective"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>
        )}

        {step === 4 && (
          <div className="relative">
            <Mountain className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input
              type="text"
              value={formData.biggestChallenge}
              onChange={(e) => handleChange('biggestChallenge', e.target.value)}
              placeholder="Your biggest hurdle"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={!isStepValid()}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          isStepValid() 
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        {step === 4 ? 'Launch FocusFlow' : 'Next'}
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default Onboarding;
