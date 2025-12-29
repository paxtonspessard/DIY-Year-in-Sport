'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SportDistributionProps {
  data: Record<string, number>; // sport type -> count
}

const COLORS = [
  '#FC4C02', // Strava orange
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export function SportDistribution({ data }: SportDistributionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const displayData = isExpanded ? chartData : chartData.slice(0, 6);
  const hiddenCount = chartData.length - 6;

  return (
    <div className="flex items-center">
      <ResponsiveContainer width="50%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              color: '#1a1a1a',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="w-1/2 space-y-2">
        {displayData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-300 flex-1 truncate">
              {entry.name}
            </span>
            <span className="text-sm text-gray-400">
              {entry.value} ({Math.round((entry.value / total) * 100) === 0 ? '<1' : Math.round((entry.value / total) * 100)}%)
            </span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}
