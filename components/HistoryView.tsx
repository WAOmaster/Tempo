import React from 'react';
import { History, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';

interface HistoryViewProps {
  tasks: Task[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
        <History className="w-10 h-10 text-gray-600 mb-4" />
        <h3 className="text-gray-300 font-medium">No Completed Tasks</h3>
        <p className="text-gray-500 text-sm mt-2">Finish tasks on the board to see them here.</p>
      </div>
    );
  }

  // Sort by completedAt descending
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-900/30 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2">
        <History className="w-4 h-4 text-accent-400" />
        <h3 className="text-gray-200 font-semibold">Activity Log</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-900/50 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-3">Task</th>
              <th className="px-6 py-3">Phase</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3 text-right">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {sortedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                  {task.title}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-gray-800 text-xs border border-gray-700">
                    {task.phase}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  {task.durationMinutes} min
                </td>
                <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                  {formatDate(task.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryView;