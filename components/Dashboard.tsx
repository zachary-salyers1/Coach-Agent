
import React, { useState } from 'react';
import { Task, TaskStatus, UserProfile } from '../types';
import { generateDailyTasks, executeTask } from '../services/gemini';
import { saveTasks, saveProfile } from '../services/storage';
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2, RefreshCw, TrendingUp, Plus, X, Bot, ChevronDown, ChevronUp, Sparkles, Pencil, Save, BrainCircuit, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  tasks: Task[];
  profile: UserProfile;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, profile, setTasks, setProfile }) => {
  const [loading, setLoading] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Editing State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [savedToMemoryId, setSavedToMemoryId] = useState<string | null>(null);
  
  // Manual Task State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    estimatedTimeMin: 30
  });

  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const handleGenerateTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const newTasks = await generateDailyTasks(profile);
      setTasks(newTasks);
      await saveTasks(newTasks);
    } catch (err) {
      setError('Could not generate tasks. Check API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description || 'Manual task',
      priority: newTask.priority,
      estimatedTimeMin: Number(newTask.estimatedTimeMin) || 15,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    
    // Reset and close
    setNewTask({ title: '', description: '', priority: 'Medium', estimatedTimeMin: 30 });
    setIsModalOpen(false);
  };

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === id 
        ? { ...t, status: t.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED }
        : t
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const handleExecuteTask = async (task: Task) => {
    if (executingTaskId) return; 
    setExecutingTaskId(task.id);
    setExpandedTaskId(task.id);
    setEditingTaskId(null);

    try {
      const result = await executeTask(task, profile);
      
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, aiExecutionResult: result } : t
      );
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const startEditing = (task: Task) => {
    if (task.aiExecutionResult) {
      setEditContent(task.aiExecutionResult);
      setEditingTaskId(task.id);
    }
  };

  const saveEdit = async (task: Task) => {
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, aiExecutionResult: editContent } : t
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setEditingTaskId(null);
  };

  const addToBrain = async (task: Task) => {
    if (!task.aiExecutionResult) return;
    
    // Use current edit content if editing, otherwise existing result
    const contentToSave = editingTaskId === task.id ? editContent : task.aiExecutionResult;
    const formattedContent = `Task: ${task.title}\nOutput: ${contentToSave}`;

    const updatedKnowledge = [...(profile.knowledgeBase || []), formattedContent];
    const updatedProfile = { ...profile, knowledgeBase: updatedKnowledge };
    
    setProfile(updatedProfile);
    await saveProfile(updatedProfile);
    
    setSavedToMemoryId(task.id);
    setTimeout(() => setSavedToMemoryId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-red-400 bg-red-950/30 border-red-900/50';
      case 'Medium': return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
      default: return 'text-blue-400 bg-blue-950/30 border-blue-900/50';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in pb-32 min-h-full relative">
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
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleGenerateTasks}
              disabled={loading}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
              Generate My Plan
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} />
              Add Manual Task
            </button>
          </div>
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">Today's Priorities</h3>
             <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 bg-slate-800 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button onClick={handleGenerateTasks} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <RefreshCw size={16} />
                </button>
             </div>
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
                  {task.status === TaskStatus.COMPLETED ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium text-base mb-1 pr-2 ${
                      task.status === TaskStatus.COMPLETED ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}>
                      {task.title}
                    </h3>
                    <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-3 ${
                    task.status === TaskStatus.COMPLETED ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.estimatedTimeMin} min
                      </div>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Execution Button */}
                      <button
                        onClick={() => handleExecuteTask(task)}
                        disabled={executingTaskId === task.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          task.aiExecutionResult 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {executingTaskId === task.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        {task.aiExecutionResult ? 'View Result' : 'Do it for me'}
                      </button>
                      
                      {/* Expand/Collapse Arrow if result exists */}
                      {task.aiExecutionResult && (
                        <button 
                          onClick={() => toggleExpand(task.id)}
                          className="p-1 text-slate-500 hover:text-white"
                        >
                          {expandedTaskId === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Result Section */}
                  {(expandedTaskId === task.id || executingTaskId === task.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 animate-slide-up">
                       {executingTaskId === task.id ? (
                         <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-2">
                            <Loader2 className="animate-spin text-indigo-400" size={24} />
                            <span className="text-xs">Generating content...</span>
                         </div>
                       ) : task.aiExecutionResult ? (
                         <div className="bg-slate-950/50 rounded-lg border border-indigo-900/20 text-sm text-slate-300 overflow-hidden">
                           
                           {/* Result Header Actions */}
                           <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-800">
                              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                                <Bot size={14} /> AI Output
                              </div>
                              <div className="flex items-center gap-2">
                                 {editingTaskId === task.id ? (
                                   <button 
                                     onClick={() => saveEdit(task)}
                                     className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded transition-colors"
                                     title="Save changes"
                                   >
                                     <Save size={16} />
                                   </button>
                                 ) : (
                                   <button 
                                      onClick={() => startEditing(task)}
                                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                      title="Edit content"
                                   >
                                      <Pencil size={14} />
                                   </button>
                                 )}
                                 
                                 <div className="w-px h-4 bg-slate-700 mx-1" />

                                 <button 
                                   onClick={() => addToBrain(task)}
                                   className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                                     savedToMemoryId === task.id 
                                       ? 'text-emerald-400 bg-emerald-950/30' 
                                       : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                                   }`}
                                   title="Add to Coach Memory"
                                 >
                                   {savedToMemoryId === task.id ? <Check size={14} /> : <BrainCircuit size={14} />}
                                 </button>
                              </div>
                           </div>

                           {/* Result Content */}
                           <div className="p-4">
                             {editingTaskId === task.id ? (
                               <textarea 
                                 value={editContent}
                                 onChange={(e) => setEditContent(e.target.value)}
                                 className="w-full h-64 bg-slate-900 text-slate-200 p-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono leading-relaxed resize-none"
                               />
                             ) : (
                               <div className="prose prose-invert prose-sm max-w-none">
                                 <ReactMarkdown>{task.aiExecutionResult}</ReactMarkdown>
                               </div>
                             )}
                           </div>

                           {!editingTaskId && (
                             <div className="px-4 pb-4 pt-0 flex justify-end">
                               <button 
                                 onClick={() => handleExecuteTask(task)}
                                 className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                               >
                                 <RefreshCw size={10} /> Regenerate
                               </button>
                             </div>
                           )}
                         </div>
                       ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Title</label>
                <input 
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g., Call supplier"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none resize-none h-20"
                  placeholder="Details..."
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 uppercase mb-1">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 uppercase mb-1">Duration (min)</label>
                  <input 
                    type="number"
                    value={newTask.estimatedTimeMin}
                    onChange={e => setNewTask({...newTask, estimatedTimeMin: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
