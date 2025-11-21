import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, UserProfile } from '../types';
import { generateDailyTasks } from '../services/gemini';
import { saveTasks } from '../services/storage';
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2, RefreshCw, TrendingUp } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  profile: UserProfile;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, profile, setTasks }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tasks for "today" - for MVP we just use the current list
  // In a real app, we'd compare dates.
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const handleGenerateTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const newTasks = await generateDailyTasks(profile);
      setTasks(newTasks);
      saveTasks(newTasks);
    } catch (err) {
      setError('Could not generate tasks. Check API Key.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === id 
        ? { ...t, status: t.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED }
        : t
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-red-400 bg-red-950/30 border-red-900/50';
      case 'Medium': return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
      default: return 'text-blue-400 bg-blue-950/30 border-blue-900/50';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in pb-32">
      {/* Header */}
      <header className="mb-8 mt-4">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, Founder.
        </h1>
        {tasks.length > 0 && (
          <div className="mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Daily Progress</span>
              <span className="text-emerald-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-inner shadow-black/50">
            <TrendingUp className="text-emerald-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to conquer the day?</h3>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">
            Let FocusFlow analyze your goals and generate a high-impact plan for today.
          </p>
          <button
            onClick={handleGenerateTasks}
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
            Generate My Plan
          </button>
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">Today's Priorities</h3>
             <button onClick={handleGenerateTasks} className="p-2 text-slate-500 hover:text-white transition-colors">
               <RefreshCw size={16} />
             </button>
          </div>

          {tasks.map((task, index) => (
            <div 
              key={task.id}
              className={`group relative bg-slate-900/50 border border-slate-800 rounded-xl p-4 transition-all duration-300 ${
                task.status === TaskStatus.COMPLETED ? 'opacity-60 bg-slate-900/30' : 'hover:bg-slate-800/50'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    task.status === TaskStatus.COMPLETED ? 'text-emerald-500' : 'text-slate-600 group-hover:text-emerald-500'
                  }`}
                >
                  {task.status === TaskStatus.COMPLETED ? (
                    <CheckCircle2 size={24} className="fill-emerald-500/10" />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-medium text-lg leading-snug transition-all ${
                      task.status === TaskStatus.COMPLETED ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-100'
                    }`}>
                      {task.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${task.status === TaskStatus.COMPLETED ? 'text-slate-600' : 'text-slate-400'}`}>
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={12} />
                    <span>{task.estimatedTimeMin} min</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
