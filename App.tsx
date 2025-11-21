import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoachChat from './components/CoachChat';
import Settings from './components/Settings';
import Strategy from './components/Strategy';
import { UserProfile, Task, ChatMessage, ViewState, StrategicPlan } from './types';
import { getProfile, saveProfile, getTasks, getChatHistory, getStrategicPlan } from './services/storage';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [strategicPlan, setStrategicPlan] = useState<StrategicPlan | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadedProfile = getProfile();
    const loadedTasks = getTasks();
    const loadedChat = getChatHistory();
    const loadedPlan = getStrategicPlan();

    if (loadedProfile && loadedProfile.isSetup) {
      setProfile(loadedProfile);
      setTasks(loadedTasks);
      setChatHistory(loadedChat);
      setStrategicPlan(loadedPlan);
      setView(ViewState.DASHBOARD);
    } else {
      setView(ViewState.ONBOARDING);
    }
    setIsInitialized(true);
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    setView(ViewState.DASHBOARD);
  };

  if (!isInitialized) return null; // Or a loading spinner

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
        />
      )}

      {view === ViewState.SETTINGS && profile && (
        <Settings profile={profile} />
      )}
    </Layout>
  );
};

export default App;