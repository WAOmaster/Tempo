import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PlanPhase } from '../types';

interface TimeDistributionProps {
  phases: PlanPhase[];
}

const TimeDistribution: React.FC<TimeDistributionProps> = ({ phases }) => {
  const data = phases.map(phase => ({
    name: phase.name,
    value: phase.totalDurationMinutes,
    color: phase.color
  }));

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-2 rounded shadow-xl">
          <p className="text-gray-200 font-medium text-sm">{`${payload[0].name}`}</p>
          <p className="text-accent-400 text-xs font-mono">
            {formatDuration(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (phases.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
        No plan generated yet
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <h3 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wider">Time Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
             verticalAlign="bottom" 
             height={36} 
             iconType="circle"
             wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeDistribution;
