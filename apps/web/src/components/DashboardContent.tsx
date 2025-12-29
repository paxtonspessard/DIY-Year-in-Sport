'use client';

import { useState, useMemo } from 'react';
import { parseISO } from 'date-fns';

// Strava incorrectly adds 'Z' suffix to start_date_local
// Strip it so parseISO treats it as local time, not UTC
function parseLocalDate(dateStr: string): Date {
  return parseISO(dateStr.replace('Z', ''));
}
import { HeroStats } from './HeroStats';
import { ActivityHeatmap } from './ActivityHeatmap';
import { MonthlyChart } from './MonthlyChart';
import { SportDistribution } from './SportDistribution';
import { FilterPills } from './FilterPills';
import { LogoutButton } from './LogoutButton';
import { ActivitySidePanel } from './ActivitySidePanel';
import { HighlightsSlideshow } from './HighlightsSlideshow';
import { computeHighlights } from '@/lib/highlights';

interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  kudos_count: number;
  average_speed: number;
  max_speed: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
}

interface Athlete {
  firstname: string;
  lastname: string;
  profile: string;
}

interface DashboardContentProps {
  activities: Activity[];
  athlete: Athlete;
  year: number;
  userId?: string;
}

export function DashboardContent({ activities, athlete, year, userId }: DashboardContentProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(false);

  // Compute highlights from all activities (not filtered)
  const highlights = useMemo(() => computeHighlights(activities, year), [activities, year]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await fetch('/api/activities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      if (res.ok) {
        setRefreshMessage(`Synced ${data.count} activities!`);
        setTimeout(() => setRefreshMessage(null), 2000);
      } else {
        setRefreshMessage(data.error || 'Failed to sync');
      }
    } catch (error) {
      setRefreshMessage('Failed to sync activities');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate activity counts for each filter
  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activities.length };
    activities.forEach((a) => {
      const type = a.sport_type || a.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  // Filter activities based on selected filter
  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return activities;
    return activities.filter((a) => {
      const type = a.sport_type || a.type;
      return type === activeFilter;
    });
  }, [activities, activeFilter]);

  // Calculate stats from filtered activities
  const stats = useMemo(() => {
    const totalDistance = filteredActivities.reduce((sum, a) => sum + a.distance, 0);
    const totalMovingTime = filteredActivities.reduce((sum, a) => sum + a.moving_time, 0);
    const totalElevation = filteredActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const totalActivities = filteredActivities.length;

    return { totalDistance, totalMovingTime, totalElevation, totalActivities };
  }, [filteredActivities]);

  // Group by sport type (for pie chart)
  const bySportType = useMemo(() => {
    return filteredActivities.reduce((acc, a) => {
      const type = a.sport_type || a.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredActivities]);

  // Group by month (for bar chart)
  const byMonth = useMemo(() => {
    return filteredActivities.reduce((acc, a) => {
      const month = parseLocalDate(a.start_date_local).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }, [filteredActivities]);

  // Monthly moving time (for animated hero graph)
  const monthlyTime = useMemo(() => {
    const timeByMonth: Record<number, number> = {};
    filteredActivities.forEach((a) => {
      const month = parseLocalDate(a.start_date_local).getMonth();
      timeByMonth[month] = (timeByMonth[month] || 0) + a.moving_time;
    });
    // Return array of 12 months with cumulative time
    return Array.from({ length: 12 }, (_, i) => timeByMonth[i] || 0);
  }, [filteredActivities]);

  // Get filter label for display
  const filterLabel = activeFilter === 'all' ? '' : ` - ${
    activeFilter === 'Ride' ? 'Cycling' :
    activeFilter === 'WeightTraining' ? 'Weightlifting' :
    activeFilter === 'Run' ? 'Running' :
    activeFilter === 'Walk' ? 'Walking' :
    activeFilter === 'Yoga' ? 'Yoga' :
    activeFilter === 'Snowboard' ? 'Snowboard' : activeFilter
  }`;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {athlete.profile && (
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-strava-orange/20 blur-md" />
              <img
                src={athlete.profile}
                alt={`${athlete.firstname} ${athlete.lastname}`}
                className="relative w-16 h-16 rounded-full ring-2 ring-strava-orange ring-offset-2 ring-offset-[#f5f3ef]"
              />
            </div>
          )}
          <div>
            <h1 className="flex items-baseline gap-3">
              <span className="text-2xl font-medium text-gray-800">{athlete.firstname}&apos;s</span>
              <span className="font-display text-5xl text-strava-orange tracking-wide">{year}</span>
              {filterLabel && (
                <span className="text-lg text-gray-500">{filterLabel}</span>
              )}
            </h1>
            <p className="text-sm uppercase tracking-widest text-gray-500 mt-1">Year in Sport</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHighlights(true)}
            className="btn-gradient-border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            View Highlights
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 rounded-xl text-sm transition-all"
            title="Sync latest activities from Strava"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Syncing...' : 'Sync'}
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Refresh message */}
      {refreshMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          refreshMessage.includes('Synced') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {refreshMessage}
        </div>
      )}

      {/* Filter Pills */}
      <FilterPills
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activityCounts={activityCounts}
      />

      {/* Hero Stats */}
      <HeroStats
        totalDistance={stats.totalDistance}
        totalTime={stats.totalMovingTime}
        totalActivities={stats.totalActivities}
        totalElevation={stats.totalElevation}
        monthlyTime={monthlyTime}
      />

      {/* Activity Heatmap */}
      <div className="card-elevated rounded-2xl p-8">
        <h2 className="section-header text-lg font-medium text-gray-200 mb-6">Activity Calendar</h2>
        <ActivityHeatmap
          activities={filteredActivities}
          year={year}
          onDateClick={setSelectedDate}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <div className="card-elevated rounded-2xl p-8">
          <h2 className="section-header text-lg font-medium text-gray-200 mb-6">Monthly Activity</h2>
          <MonthlyChart data={byMonth} />
        </div>

        {/* Sport Distribution */}
        <div className="card-elevated rounded-2xl p-8">
          <h2 className="section-header text-lg font-medium text-gray-200 mb-6">Sport Distribution</h2>
          <SportDistribution data={bySportType} />
        </div>
      </div>

      {/* Activity Side Panel */}
      <ActivitySidePanel
        selectedDate={selectedDate}
        activities={filteredActivities}
        onClose={() => setSelectedDate(null)}
      />

      {/* Highlights Slideshow */}
      {showHighlights && highlights.length > 0 && (
        <HighlightsSlideshow
          highlights={highlights}
          year={year}
          onClose={() => setShowHighlights(false)}
        />
      )}
    </>
  );
}
