
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoachChat from './components/CoachChat';
import Settings from './components/Settings';
import Strategy from './components/Strategy';
import { UserProfile, Task, ChatMessage, ViewState, StrategicPlan } from './types';
import { getProfile, saveProfile, getTasks, getChatHistory, getStrategicPlan } from './services/storage';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [strategicPlan, setStrategicPlan] = useState<StrategicPlan | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const [loadedProfile, loadedTasks, loadedChat, loadedPlan] = await Promise.all([
          getProfile(),
          getTasks(),
          getChatHistory(),
          getStrategicPlan()
        ]);

        if (loadedProfile && loadedProfile.isSetup) {
          setProfile(loadedProfile);
          setTasks(loadedTasks);
          setChatHistory(loadedChat);
          setStrategicPlan(loadedPlan);
          setView(ViewState.DASHBOARD);
        } else {
          setView(ViewState.ONBOARDING);
        }
      } catch (error) {
        console.error("Failed to load data from DB:", error);
        // Fallback to onboarding if DB fails
        setView(ViewState.ONBOARDING);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await saveProfile(newProfile);
    setView(ViewState.DASHBOARD);
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <span className="text-sm font-medium tracking-wider">LOADING DATABASE</span>
      </div>
    );
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === ViewState.ONBOARDING && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {view === ViewState.DASHBOARD && profile && (
        <Dashboard 
          tasks={tasks} 
          profile={profile} 
          setTasks={setTasks}
          setProfile={setProfile}
        />
      )}

      {view === ViewState.STRATEGY && profile && (
        <Strategy
          profile={profile}
          plan={strategicPlan}
          setPlan={setStrategicPlan}
          setTasks={setTasks}
          onNavigate={setView}
        />
      )}

      {view === ViewState.COACH && profile && (
        <CoachChat 
          history={chatHistory} 
          setHistory={setChatHistory} 
          profile={profile}
          tasks={tasks}
        />
      )}

      {view === ViewState.SETTINGS && profile && (
        <Settings profile={profile} />
      )}
    </Layout>
  );
};

export default App;
