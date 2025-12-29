'use client';

interface FilterPillsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activityCounts: Record<string, number>;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Ride', label: 'Cycling' },
  { id: 'WeightTraining', label: 'Weightlifting' },
  { id: 'Run', label: 'Running' },
  { id: 'Walk', label: 'Walk' },
  { id: 'Yoga', label: 'Yoga' },
  { id: 'Snowboard', label: 'Snowboard' },
];

export function FilterPills({ activeFilter, onFilterChange, activityCounts }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const count = filter.id === 'all'
          ? activityCounts.all
          : activityCounts[filter.id] || 0;

        // Only show filters that have activities (except 'All')
        if (filter.id !== 'all' && count === 0) return null;

        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-strava-orange text-white shadow-glow-orange-sm'
                : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {filter.label}
            <span className={`ml-2 font-display text-base ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
