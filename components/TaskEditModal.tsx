import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        durationMinutes: task.durationMinutes,
        priority: task.priority
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSave({ ...task, ...formData } as Task);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl w-full max-w-lg shadow-2xl p-6 relative animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Edit Task
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Task Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none transition-all focus:border-accent-500/50"
              required
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
             <div className="flex gap-3">
               {(Object.values(Priority) as Priority[]).map((p) => (
                 <button
                   key={p}
                   type="button"
                   onClick={() => setFormData({...formData, priority: p})}
                   className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${
                     formData.priority === p 
                       ? 'bg-accent-500/20 border-accent-500 text-accent-400 shadow-lg shadow-accent-500/10' 
                       : 'bg-black/40 border-white/10 text-gray-500 hover:bg-white/5 hover:border-white/20'
                   }`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Duration (minutes)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={formData.durationMinutes || 0}
                onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none pl-10 transition-all focus:border-accent-500/50"
                required
              />
              <Clock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none h-28 resize-none transition-all focus:border-accent-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-accent-600 hover:bg-accent-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent-500/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditModal;