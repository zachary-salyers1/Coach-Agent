import React from 'react';
import { UserProfile } from '../types';
import { clearData } from '../services/storage';
import { User, Briefcase, Target, LogOut } from 'lucide-react';

interface SettingsProps {
  profile: UserProfile;
}

const Settings: React.FC<SettingsProps> = ({ profile }) => {
  const handleReset = () => {
    if (confirm("Are you sure? This will delete all your tasks and chat history.")) {
      clearData();
      window.location.reload();
    }
  };

  return (
    <div className="p-6 pt-12 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-8">Profile & Settings</h1>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-400 text-sm font-medium uppercase mb-4 flex items-center gap-2">
             <User size={16} /> Business Profile
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500">Business Name</label>
              <div className="text-white text-lg font-medium">{profile.businessName}</div>
            </div>
            
            <div>
               <label className="text-xs text-slate-500">Industry</label>
               <div className="flex items-center gap-2 text-slate-300">
                 <Briefcase size={14} />
                 {profile.industry}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-400 text-sm font-medium uppercase mb-4 flex items-center gap-2">
             <Target size={16} /> Goals
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500">Main Goal</label>
              <div className="text-emerald-400 font-medium">{profile.mainGoal}</div>
            </div>
            
            <div>
               <label className="text-xs text-slate-500">Biggest Challenge</label>
               <div className="text-red-400 font-medium">{profile.biggestChallenge}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleReset}
          className="w-full py-4 mt-8 border border-red-900/50 bg-red-950/20 text-red-400 rounded-xl flex items-center justify-center gap-2 hover:bg-red-950/40 transition-colors"
        >
          <LogOut size={18} />
          Reset App Data
        </button>
        
        <p className="text-center text-xs text-slate-600 mt-4">
          FocusFlow v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
