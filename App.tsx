import React, { useState } from 'react';
import { Sparkles, ArrowLeft, LayoutDashboard, ListTodo, History as HistoryIcon, Image as ImageIcon } from 'lucide-react';
import CountdownTimer from './components/CountdownTimer';
import EventSetup from './components/EventSetup';
import TaskBoard from './components/TaskBoard';
import TimeDistribution from './components/TimeDistribution';
import HistoryView from './components/HistoryView';
import ImageStudio from './components/ImageStudio';
import { generateProjectPlan } from './services/geminiService';
import { GeneratedPlan, ProjectState, TaskStatus, Task } from './types';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    name: '',
    deadline: null,
    description: ''
  });

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'board' | 'history' | 'studio'>('board');
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [bgImage, setBgImage] = useState<string | null>(null);

  const handleSetupConfirm = (name: string, date: Date, description: string) => {
    setProject({ name, deadline: date, description });
  };

  const handleReset = () => {
    setProject({ name: '', deadline: null, description: '' });
    setPlan(null);
    setTaskHistory([]);
  };

  const handleGeneratePlan = async () => {
    if (!project.deadline) return;
    
    setLoadingPlan(true);
    const minutesRemaining = Math.max(0, Math.floor(remainingMs / 1000 / 60));
    
    try {
      const generatedPlan = await generateProjectPlan(
        project.name, 
        project.description || "Hackathon Project", 
        minutesRemaining
      );
      setPlan(generatedPlan);
    } catch (error) {
      console.error("Failed to generate plan");
      alert("Could not generate plan. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleTaskToggle = (taskId: string, currentStatus: TaskStatus) => {
    if (!plan) return;

    const newStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    
    // Update the Plan state
    const updatedPhases = plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => {
        if (task.id === taskId) {
           return { 
             ...task, 
             status: newStatus,
             completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined
           };
        }
        return task;
      })
    }));

    setPlan({ ...plan, phases: updatedPhases });

    // Handle History Logic
    if (newStatus === TaskStatus.DONE) {
       // Find the task and add to history
       let taskToAdd: Task | undefined;
       for (const phase of updatedPhases) {
         const t = phase.tasks.find(t => t.id === taskId);
         if (t) {
            taskToAdd = t;
            break;
         }
       }
       if (taskToAdd) {
         setTaskHistory(prev => [taskToAdd!, ...prev]);
       }
    } else {
      // Remove from history if unchecked
      setTaskHistory(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleEditTask = (updatedTask: Task) => {
    if (!plan) return;

    const updatedPhases = plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    }));

    // Recalculate total estimated minutes for phases and total plan
    let newTotalMinutes = 0;
    const phasesWithRecalculatedDuration = updatedPhases.map(phase => {
        const phaseTotal = phase.tasks.reduce((acc, t) => acc + t.durationMinutes, 0);
        newTotalMinutes += phaseTotal;
        return { ...phase, totalDurationMinutes: phaseTotal };
    });

    setPlan({ 
      ...plan, 
      phases: phasesWithRecalculatedDuration,
      totalEstimatedMinutes: newTotalMinutes
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4 md:p-8 transition-all duration-1000 ease-in-out bg-cover bg-center font-sans selection:bg-accent-500/30"
      style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
    >
      {/* Background Overlay if image is set, to maintain contrast */}
      {bgImage && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}

      {/* Floating Window Container */}
      <div className="relative w-full max-w-7xl h-full max-h-[900px] bg-gray-950/80 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* Navigation Bar */}
          {project.deadline && (
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
              <div className="px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleReset}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                    title="Reset Project"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="font-bold text-lg text-gray-200 tracking-tight truncate max-w-[200px] md:max-w-md">
                    {project.name}
                  </h1>
                </div>
                
                <div className="flex items-center gap-4">
                  {plan && (
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                        <button
                          onClick={() => setActiveTab('board')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'board' 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <LayoutDashboard className="w-3 h-3" />
                          Board
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'history' 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <HistoryIcon className="w-3 h-3" />
                          History
                        </button>
                        <button
                          onClick={() => setActiveTab('studio')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'studio' 
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          Studio
                        </button>
                    </div>
                  )}
                  {plan && (
                      <div className="hidden md:flex items-center gap-2 text-xs text-accent-400 bg-accent-500/10 px-3 py-1.5 rounded-full border border-accent-500/20">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Plan Active</span>
                      </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          <main className="px-6 py-8 space-y-8">
            {!project.deadline ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <EventSetup onConfirm={handleSetupConfirm} />
              </div>
            ) : (
              <>
                {/* Top Section: Countdown */}
                <section className="flex flex-col items-center">
                  <CountdownTimer 
                    targetDate={project.deadline} 
                    onTick={(ms) => setRemainingMs(ms)} 
                  />
                </section>

                {/* Action Area */}
                {!plan && (
                  <section className="flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-lg w-full text-center">
                        <Sparkles className="w-12 h-12 text-accent-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Need a Game Plan?</h2>
                        <p className="text-gray-400 mb-6">
                          Gemini can analyze your remaining time and generate a phased schedule with actionable tasks.
                        </p>
                        <button
                          onClick={handleGeneratePlan}
                          disabled={loadingPlan}
                          className="w-full bg-accent-600 hover:bg-accent-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loadingPlan ? (
                            <>Generating Schedule...</>
                          ) : (
                            <>Generate Tasks & Timeline</>
                          )}
                        </button>
                    </div>
                  </section>
                )}

                {/* Dashboard Grid */}
                {plan && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700 pb-10">
                    
                    {/* Left Column: Stats & Advice */}
                    <div className="space-y-6">
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">AI Advisor</h3>
                        <p className="text-sm text-gray-300 italic leading-relaxed">
                          "{plan.advice}"
                        </p>
                      </div>

                      <TimeDistribution phases={plan.phases} />
                    </div>

                    {/* Right Column: Tasks or History or Studio */}
                    <div className="lg:col-span-2">
                      {activeTab === 'board' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                              <ListTodo className="w-5 h-5 text-accent-400" />
                              Action Plan
                            </h3>
                            <div className="text-sm text-gray-500">
                              {plan.totalEstimatedMinutes} mins estimated work
                            </div>
                          </div>
                          <TaskBoard 
                            phases={plan.phases} 
                            onToggleTask={handleTaskToggle}
                            onEditTask={handleEditTask}
                          />
                        </>
                      )}
                      {activeTab === 'history' && <HistoryView tasks={taskHistory} />}
                      {activeTab === 'studio' && <ImageStudio onSetBackground={setBgImage} />}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;