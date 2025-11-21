import React from 'react';
import { LayoutDashboard, MessageSquare, Settings, Compass } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  // Don't show nav on onboarding
  if (currentView === ViewState.ONBOARDING) {
    return <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">{children}</div>;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-around pb-2 z-50">
        <button
          onClick={() => onNavigate(ViewState.DASHBOARD)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
            currentView === ViewState.DASHBOARD ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard size={24} strokeWidth={currentView === ViewState.DASHBOARD ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Plan</span>
        </button>

        <button
          onClick={() => onNavigate(ViewState.STRATEGY)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
            currentView === ViewState.STRATEGY ? 'text-purple-400' : 'text-slate-500'
          }`}
        >
          <Compass size={24} strokeWidth={currentView === ViewState.STRATEGY ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Strategy</span>
        </button>

        <button
          onClick={() => onNavigate(ViewState.COACH)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
            currentView === ViewState.COACH ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <MessageSquare size={24} strokeWidth={currentView === ViewState.COACH ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Coach</span>
        </button>

        <button
          onClick={() => onNavigate(ViewState.SETTINGS)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
            currentView === ViewState.SETTINGS ? 'text-slate-200' : 'text-slate-500'
          }`}
        >
          <Settings size={24} strokeWidth={currentView === ViewState.SETTINGS ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;