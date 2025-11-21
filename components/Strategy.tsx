import React, { useState } from 'react';
import { UserProfile, StrategicPlan, Task, ViewState } from '../types';
import { generateGoalStrategy } from '../services/gemini';
import { saveStrategicPlan, saveTasks } from '../services/storage';
import { Target, Flag, BookOpen, Podcast, Wrench, FileText, ArrowRight, Loader2, CheckCircle2, Plus, Lightbulb } from 'lucide-react';

interface StrategyProps {
  profile: UserProfile;
  plan: StrategicPlan | null;
  setPlan: React.Dispatch<React.SetStateAction<StrategicPlan | null>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigate: (view: ViewState) => void;
}

const Strategy: React.FC<StrategyProps> = ({ profile, plan, setPlan, setTasks, onNavigate }) => {
  const [inputGoal, setInputGoal] = useState(profile.mainGoal || '');
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);

  const handleAnalyze = async () => {
    if (!inputGoal.trim()) return;
    setLoading(true);
    setGeneratedTasks([]);
    
    try {
      const strategy = await generateGoalStrategy(inputGoal, profile);
      
      const newPlan: StrategicPlan = {
        originalGoal: inputGoal,
        smartGoal: strategy.smartGoal,
        milestones: strategy.milestones,
        resources: strategy.resources,
        generatedAt: Date.now()
      };

      setPlan(newPlan);
      saveStrategicPlan(newPlan);
      setGeneratedTasks(strategy.immediateTasks);
      
    } catch (error) {
      console.error(error);
      // Simple error handling
      alert("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addTasksToDashboard = () => {
    setTasks(prev => {
      const updated = [...prev, ...generatedTasks];
      saveTasks(updated);
      return updated;
    });
    onNavigate(ViewState.DASHBOARD);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Book': return <BookOpen size={18} className="text-blue-400" />;
      case 'Podcast': return <Podcast size={18} className="text-purple-400" />;
      case 'Tool': return <Wrench size={18} className="text-orange-400" />;
      default: return <FileText size={18} className="text-emerald-400" />;
    }
  };

  return (
    <div className="p-6 pt-8 animate-fade-in pb-32">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-900/30 flex items-center justify-center border border-purple-500/30">
          <Target className="text-purple-400" size={20} />
        </div>
        <h1 className="text-2xl font-bold text-white">Strategy & Growth</h1>
      </div>

      {/* Goal Input Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 shadow-lg">
        <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Primary Business Objective
        </label>
        <textarea
          value={inputGoal}
          onChange={(e) => setInputGoal(e.target.value)}
          placeholder="e.g., Launch my new product line by next month..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none text-sm leading-relaxed"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !inputGoal.trim()}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Analyzing Strategy...
            </>
          ) : (
            <>
              <Lightbulb size={18} /> Create Action Plan
            </>
          )}
        </button>
      </div>

      {plan && (
        <div className="animate-slide-up space-y-8">
          
          {/* SMART Goal */}
          <div className="bg-slate-900/50 border-l-4 border-emerald-500 p-4 rounded-r-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-1">Refined SMART Goal</h3>
            <p className="text-white font-medium leading-relaxed">{plan.smartGoal}</p>
          </div>

          {/* Milestones */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flag size={18} className="text-purple-400" /> 4-Week Roadmap
            </h3>
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {plan.milestones.map((m) => (
                <div key={m.week} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {m.week}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-purple-300 font-medium text-sm mb-1">Week {m.week}: {m.focus}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{m.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Actions (Generated Tasks) */}
          {generatedTasks.length > 0 && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5">
              <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} /> Recommended Tasks
              </h3>
              <p className="text-xs text-emerald-200/60 mb-4">
                I've identified {generatedTasks.length} tasks to get you moving immediately.
              </p>
              <div className="space-y-2 mb-4">
                {generatedTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-emerald-900/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={addTasksToDashboard}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
              >
                <Plus size={16} /> Add to Daily Dashboard
              </button>
            </div>
          )}

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" /> Suggested Resources
            </h3>
            <div className="grid gap-4">
              {plan.resources.map((r) => (
                <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl group hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-950 py-1 px-2 rounded-md">
                      {getResourceIcon(r.type)}
                      {r.type}
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-1">{r.title}</h4>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{r.description}</p>
                  <div className="text-xs text-purple-400/80 italic border-t border-slate-800/50 pt-2">
                    "{r.reason}"
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Strategy;