import React, { useState } from 'react';
import { X, Plus, Calendar, Trash2, BrainCircuit, Loader2, Trophy } from 'lucide-react';
import { SavedProject } from '../types';
import { generateMasterStrategy } from '../services/geminiService';
import MasterStrategyModal from './MasterStrategyModal';

interface ProjectListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onAddNew: () => void;
}

const ProjectListSidebar: React.FC<ProjectListSidebarProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onAddNew
}) => {
  const [strategy, setStrategy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const handleGenerateStrategy = async () => {
    if (projects.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generateMasterStrategy(projects);
      setStrategy(result);
      setShowStrategyModal(true);
    } catch (error) {
      alert("Failed to generate strategy.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gray-950/80 backdrop-blur-2xl border-r border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-400" />
              My Hackathons
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {projects.length === 0 ? (
              <div className="text-center text-gray-500 py-10 px-4">
                <p>No hackathons saved.</p>
                <p className="text-xs mt-2">Start a new project to track it here.</p>
              </div>
            ) : (
              projects.map(project => {
                const daysLeft = getDaysLeft(project.deadline);
                const isActive = project.id === activeProjectId;

                return (
                  <div 
                    key={project.id}
                    className={`rounded-xl p-4 border transition-all cursor-pointer group relative ${
                      isActive 
                        ? 'bg-accent-500/10 border-accent-500/50 shadow-lg shadow-accent-500/10' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                    onClick={() => {
                        onSelectProject(project.id);
                        onClose();
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-sm truncate pr-6 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {project.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Delete this project?')) onDeleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                       <span className={`text-xs font-mono px-2 py-0.5 rounded ${daysLeft < 3 ? 'bg-red-500/20 text-red-300' : 'bg-gray-800 text-gray-300'}`}>
                         {daysLeft} days left
                       </span>
                       {project.plan && (
                         <span className="text-[10px] text-accent-400 font-medium">
                           {project.plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'DONE').length, 0)} / {project.plan.phases.reduce((acc, p) => acc + p.tasks.length, 0)} Tasks
                         </span>
                       )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
             <button
              onClick={() => {
                onAddNew();
                onClose();
              }}
              className="w-full py-2.5 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Hackathon
            </button>

            {projects.length > 0 && (
                <button
                onClick={handleGenerateStrategy}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                AI Master Plan
                </button>
            )}
          </div>
        </div>
      </div>

      <MasterStrategyModal 
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        strategy={strategy || ''}
      />
    </>
  );
};

export default ProjectListSidebar;