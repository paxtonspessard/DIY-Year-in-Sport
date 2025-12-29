'use client';

import {
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  format,
  getDay,
  parseISO,
  getMonth,
} from 'date-fns';

// Strava incorrectly adds 'Z' suffix to start_date_local
// Strip it so parseISO treats it as local time, not UTC
function parseLocalDate(dateStr: string): Date {
  return parseISO(dateStr.replace('Z', ''));
}

interface Activity {
  start_date_local: string;
  distance: number;
  moving_time: number;
}

interface ActivityHeatmapProps {
  activities: Activity[];
  year: number;
  onDateClick?: (date: string) => void;
}

export function ActivityHeatmap({ activities, year, onDateClick }: ActivityHeatmapProps) {
  // Create a map of date -> activity count
  const activityMap = activities.reduce((acc, activity) => {
    const date = format(parseLocalDate(activity.start_date_local), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all days of the year
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Get max activities for color scaling
  const maxActivities = Math.max(...Object.values(activityMap), 1);

  // Get intensity class based on activity count
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-surface-tertiary';
    const ratio = count / maxActivities;
    if (ratio <= 0.25) return 'bg-strava-orange/30';
    if (ratio <= 0.5) return 'bg-strava-orange/50';
    if (ratio <= 0.75) return 'bg-strava-orange/75';
    return 'bg-strava-orange shadow-glow-orange-sm';
  };

  // Group by week (Sunday = 0 start)
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Pad the first week (getDay: 0=Sun, 1=Mon, etc.)
  const firstDayOfWeek = getDay(allDays[0]);
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  allDays.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  // Pad the last week
  while (currentWeek.length < 7) {
    currentWeek.push(null);
  }
  weeks.push(currentWeek);

  // Calculate month label positions based on actual weeks
  const monthLabels: { month: string; weekIndex: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  weeks.forEach((week, weekIndex) => {
    const firstValidDay = week.find(d => d !== null);
    if (firstValidDay) {
      const month = getMonth(firstValidDay);
      // Check if this is the first week of this month
      const existingLabel = monthLabels.find(l => l.month === monthNames[month]);
      if (!existingLabel) {
        monthLabels.push({ month: monthNames[month], weekIndex });
      }
    }
  });

  return (
    <div className="w-full">
      {/* Month labels - evenly distributed */}
      <div className="flex mb-3 text-xs text-gray-500 uppercase tracking-wider">
        <div className="w-8 shrink-0" /> {/* Spacer for day labels */}
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
          <div key={month} className="flex-1">
            {month}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex">
        {/* Day labels */}
        <div className="w-8 shrink-0 flex flex-col justify-around text-xs text-gray-500 pr-2">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {/* Weeks - fills remaining space */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '2px' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: '2px' }}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${dayIndex}`}
                      className="aspect-square rounded-sm bg-transparent"
                    />
                  );
                }

                const dateStr = format(day, 'yyyy-MM-dd');
                const count = activityMap[dateStr] || 0;

                return (
                  <div
                    key={dateStr}
                    onClick={() => onDateClick?.(dateStr)}
                    className={`aspect-square rounded-sm ${getIntensityClass(count)} transition-all hover:ring-1 hover:ring-white/50 hover:scale-110 cursor-pointer`}
                    title={`${format(day, 'MMM d, yyyy')}: ${count} ${count === 1 ? 'activity' : 'activities'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 mt-6 text-xs text-gray-500">
        <span className="uppercase tracking-wider">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-tertiary border border-white/5" />
          <div className="w-3 h-3 rounded-sm bg-strava-orange/30" />
          <div className="w-3 h-3 rounded-sm bg-strava-orange/50" />
          <div className="w-3 h-3 rounded-sm bg-strava-orange/75" />
          <div className="w-3 h-3 rounded-sm bg-strava-orange" />
        </div>
        <span className="uppercase tracking-wider">More</span>
      </div>
    </div>
  );
}
