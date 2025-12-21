import React, { useState, useEffect } from 'react';
import { Sparkles, LayoutDashboard, ListTodo, History as HistoryIcon, Image as ImageIcon, Menu } from 'lucide-react';
import CountdownTimer from './components/CountdownTimer';
import EventSetup from './components/EventSetup';
import TaskBoard from './components/TaskBoard';
import TimeDistribution from './components/TimeDistribution';
import HistoryView from './components/HistoryView';
import ImageStudio from './components/ImageStudio';
import ProjectListSidebar from './components/ProjectListSidebar';
import { generateProjectPlan } from './services/geminiService';
import { GeneratedPlan, TaskStatus, Task, SavedProject } from './types';

const App: React.FC = () => {
  // --- State Management ---
  
  // All projects stored
  const [projects, setProjects] = useState<SavedProject[]>(() => {
    const saved = localStorage.getItem('tempo-projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Currently active project ID. If null, showing "Create New/EventSetup"
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = localStorage.getItem('tempo-active-id');
    // Default to the first project if exists and no active ID is saved
    const allProjects = localStorage.getItem('tempo-projects') ? JSON.parse(localStorage.getItem('tempo-projects')!) : [];
    if (!saved && allProjects.length > 0) return allProjects[0].id;
    return saved || null;
  });

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'board' | 'history' | 'studio'>('board');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Derived Active Project
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // --- Persistence ---

  useEffect(() => {
    localStorage.setItem('tempo-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('tempo-active-id', activeProjectId);
    } else {
      localStorage.removeItem('tempo-active-id');
    }
  }, [activeProjectId]);

  // --- Handlers ---

  const handleSetupConfirm = (name: string, date: Date, description: string) => {
    const newProject: SavedProject = {
      id: crypto.randomUUID(),
      name,
      deadline: date.toISOString(),
      description,
      plan: null,
      taskHistory: [],
      createdAt: new Date().toISOString()
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const updateActiveProject = (updates: Partial<SavedProject>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, ...updates } : p
    ));
  };

  const handleGeneratePlan = async () => {
    if (!activeProject) return;
    
    setLoadingPlan(true);
    const minutesRemaining = Math.max(0, Math.floor(remainingMs / 1000 / 60));
    
    try {
      const generatedPlan = await generateProjectPlan(
        activeProject.name, 
        activeProject.description || "Hackathon Project", 
        minutesRemaining
      );
      updateActiveProject({ plan: generatedPlan });
    } catch (error) {
      console.error("Failed to generate plan");
      alert("Could not generate plan. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleTaskToggle = (taskId: string, currentStatus: TaskStatus) => {
    if (!activeProject || !activeProject.plan) return;

    const newStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    
    // Update the Plan phases
    const updatedPhases = activeProject.plan.phases.map(phase => ({
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

    // Handle History Logic
    let updatedHistory = [...activeProject.taskHistory];
    if (newStatus === TaskStatus.DONE) {
       let taskToAdd: Task | undefined;
       for (const phase of updatedPhases) {
         const t = phase.tasks.find(t => t.id === taskId);
         if (t) {
            taskToAdd = t;
            break;
         }
       }
       if (taskToAdd && !updatedHistory.find(h => h.id === taskId)) {
         updatedHistory = [taskToAdd, ...updatedHistory];
       }
    } else {
      updatedHistory = updatedHistory.filter(t => t.id !== taskId);
    }

    updateActiveProject({
      plan: { ...activeProject.plan, phases: updatedPhases },
      taskHistory: updatedHistory
    });
  };

  const handleEditTask = (updatedTask: Task) => {
    if (!activeProject || !activeProject.plan) return;

    const updatedPhases = activeProject.plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    }));

    // Recalculate total estimated minutes
    let newTotalMinutes = 0;
    const phasesWithRecalculatedDuration = updatedPhases.map(phase => {
        const phaseTotal = phase.tasks.reduce((acc, t) => acc + t.durationMinutes, 0);
        newTotalMinutes += phaseTotal;
        return { ...phase, totalDurationMinutes: phaseTotal };
    });

    updateActiveProject({
      plan: { 
        ...activeProject.plan, 
        phases: phasesWithRecalculatedDuration,
        totalEstimatedMinutes: newTotalMinutes
      }
    });
  };

  const handleSetBackground = (url: string) => {
    updateActiveProject({ backgroundImage: url });
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  // --- Render ---

  // Use background image from active project if available
  const currentBg = activeProject?.backgroundImage;

  return (
    <div 
      className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4 md:p-8 transition-all duration-1000 ease-in-out bg-cover bg-center font-sans selection:bg-accent-500/30"
      style={{ backgroundImage: currentBg ? `url(${currentBg})` : undefined }}
    >
      {/* Background Overlay */}
      {currentBg && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />}

      {/* Floating Window Container */}
      <div className="relative w-full max-w-7xl h-full max-h-[900px] bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5 animate-in zoom-in-95 duration-500">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          
          {/* Top Bar / Navigation */}
          <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-30 h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setIsSidebarOpen(true)}
                   className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                 >
                   <Menu className="w-5 h-5" />
                   <span className="text-xs font-bold uppercase tracking-wider hidden md:block">My Hackathons</span>
                 </button>
                 
                 {activeProject && (
                    <div className="h-6 w-px bg-white/10 mx-2" />
                 )}

                 {activeProject && (
                    <h1 className="font-bold text-lg text-gray-100 tracking-tight truncate max-w-[200px] md:max-w-md drop-shadow-sm">
                        {activeProject.name}
                    </h1>
                 )}
              </div>
              
              <div className="flex items-center gap-4">
                  {activeProject && activeProject.plan && (
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
                        <button
                          onClick={() => setActiveTab('board')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'board' 
                              ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                        >
                          <LayoutDashboard className="w-3 h-3" />
                          Board
                        </button>
                        <button
                          onClick={() => setActiveTab('history')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'history' 
                              ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                        >
                          <HistoryIcon className="w-3 h-3" />
                          History
                        </button>
                        <button
                          onClick={() => setActiveTab('studio')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'studio' 
                              ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          Studio
                        </button>
                    </div>
                  )}
                  {activeProject && activeProject.plan && (
                      <div className="hidden md:flex items-center gap-2 text-xs text-accent-400 bg-accent-500/10 px-3 py-1.5 rounded-full border border-accent-500/20 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Active</span>
                      </div>
                  )}
              </div>
          </nav>

          {/* Main Content Area */}
          <main className="px-6 py-8 space-y-8">
            {!activeProject ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <EventSetup onConfirm={handleSetupConfirm} />
              </div>
            ) : (
              <>
                {/* Countdown */}
                <section className="flex flex-col items-center">
                  <CountdownTimer 
                    targetDate={new Date(activeProject.deadline)} 
                    onTick={(ms) => setRemainingMs(ms)} 
                  />
                </section>

                {/* Plan Generation Call to Action */}
                {!activeProject.plan && (
                  <section className="flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full text-center">
                        <Sparkles className="w-12 h-12 text-accent-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Need a Game Plan?</h2>
                        <p className="text-gray-300 mb-6">
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

                {/* Dashboard */}
                {activeProject.plan && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700 pb-10">
                    
                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">AI Advisor</h3>
                        <p className="text-sm text-gray-200 italic leading-relaxed">
                          "{activeProject.plan.advice}"
                        </p>
                      </div>

                      <TimeDistribution phases={activeProject.plan.phases} />
                    </div>

                    {/* Main Workspace */}
                    <div className="lg:col-span-2">
                      {activeTab === 'board' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white drop-shadow-md">
                              <ListTodo className="w-5 h-5 text-accent-400" />
                              Action Plan
                            </h3>
                            <div className="text-sm text-gray-400 font-medium bg-black/30 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                              {activeProject.plan.totalEstimatedMinutes} mins estimated work
                            </div>
                          </div>
                          <TaskBoard 
                            phases={activeProject.plan.phases} 
                            onToggleTask={handleTaskToggle}
                            onEditTask={handleEditTask}
                          />
                        </>
                      )}
                      {activeTab === 'history' && <HistoryView tasks={activeProject.taskHistory} />}
                      {activeTab === 'studio' && <ImageStudio onSetBackground={handleSetBackground} />}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <ProjectListSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onDeleteProject={handleDeleteProject}
        onAddNew={() => setActiveProjectId(null)}
      />
    </div>
  );
};

export default App;