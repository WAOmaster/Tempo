import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowUpNarrowWide, ListFilter, AlertOctagon, AlertTriangle, Info, Pencil } from 'lucide-react';
import { PlanPhase, Task, TaskStatus, Priority } from '../types';
import TaskEditModal from './TaskEditModal';

interface TaskBoardProps {
  phases: PlanPhase[];
  onToggleTask: (taskId: string, currentStatus: TaskStatus) => void;
  onEditTask: (updatedTask: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ phases, onToggleTask, onEditTask }) => {
  const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return <CheckCircle2 className="w-5 h-5 text-green-500 transition-all duration-300" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400 transition-colors" />;
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return (
          <div className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-red-400/20">
            <AlertOctagon className="w-3 h-3" /> High
          </div>
        );
      case Priority.MEDIUM:
        return (
          <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-orange-400/20">
            <AlertTriangle className="w-3 h-3" /> Med
          </div>
        );
      case Priority.LOW:
        return (
          <div className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-blue-400/20">
            <Info className="w-3 h-3" /> Low
          </div>
        );
      default:
        return null;
    }
  };

  const sortTasks = (tasks: Task[]) => {
    if (sortBy === 'default') return tasks;
    
    const priorityOrder = {
      [Priority.HIGH]: 0,
      [Priority.MEDIUM]: 1,
      [Priority.LOW]: 2
    };

    return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  if (!phases || phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 border-dashed">
        <AlertCircle className="w-10 h-10 text-gray-600 mb-4" />
        <h3 className="text-gray-300 font-medium">No Tasks Generated</h3>
        <p className="text-gray-500 text-sm mt-2">Use the generator above to create a plan.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setSortBy(prev => prev === 'default' ? 'priority' : 'default')}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 ${
              sortBy === 'priority' 
                ? 'bg-accent-500/20 border-accent-500/50 text-accent-400 backdrop-blur-sm' 
                : 'bg-black/20 border-white/10 text-gray-400 hover:text-gray-200 backdrop-blur-sm hover:bg-white/5'
            }`}
          >
            {sortBy === 'priority' ? <ArrowUpNarrowWide className="w-3 h-3" /> : <ListFilter className="w-3 h-3" />}
            Sort by Priority
          </button>
        </div>

        {phases.map((phase) => (
          <div key={phase.name} className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden shadow-sm">
            {/* Phase Header */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: phase.color }} />
                <h3 className="text-gray-200 font-semibold text-shadow-sm">{phase.name}</h3>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {Math.floor(phase.totalDurationMinutes / 60)}h {phase.totalDurationMinutes % 60}m
              </span>
            </div>

            {/* Task List */}
            <div className="divide-y divide-white/5">
              {sortTasks(phase.tasks).map((task) => (
                <div 
                  key={task.id} 
                  className={`p-4 flex items-start gap-4 transition-all duration-300 ease-out hover:bg-white/5 border-l-[3px] group ${
                    task.status === TaskStatus.DONE 
                      ? 'opacity-50 bg-black/10 border-transparent grayscale-[0.5] scale-[0.995]' 
                      : 'opacity-100 border-transparent hover:border-white/10'
                  }`}
                >
                  <button 
                    onClick={() => onToggleTask(task.id, task.status)}
                    className="mt-1 flex-shrink-0 focus:outline-none transition-transform active:scale-90 group/btn"
                  >
                    <div className={`transition-all duration-300 ${task.status === TaskStatus.DONE ? 'scale-110' : 'group-hover/btn:scale-105'}`}>
                      {getStatusIcon(task.status)}
                    </div>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium transition-all duration-300 ${
                        task.status === TaskStatus.DONE 
                          ? 'text-gray-500 line-through decoration-gray-600' 
                          : 'text-gray-200'
                      }`}>
                        {task.title}
                      </h4>
                      {getPriorityIcon(task.priority)}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 text-xs text-gray-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.durationMinutes}m
                    </div>
                    <button
                        onClick={() => setEditingTask(task)}
                        className="p-1.5 text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 active:scale-90"
                        title="Edit Task"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <TaskEditModal 
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(updatedTask) => {
          onEditTask(updatedTask);
          setEditingTask(null);
        }}
      />
    </>
  );
};

export default TaskBoard;