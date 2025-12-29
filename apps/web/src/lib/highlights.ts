import { CachedActivity } from './activity-cache';
import { parseISO } from 'date-fns';

// Strip Z suffix from Strava's start_date_local (they incorrectly add it)
function parseLocalDate(dateStr: string): Date {
  return parseISO(dateStr.replace('Z', ''));
}

export interface Highlight {
  type: 'record' | 'pattern' | 'social' | 'fun';
  title: string;
  value: string;
  subtitle?: string;
  activity?: CachedActivity;
  icon: string;
  color: string;
  photos?: string[]; // Array of photo URLs
}

// Format distance in miles
function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles >= 100 ? Math.round(miles).toLocaleString() : miles.toFixed(1);
}

// Format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

// Format elevation in feet
function formatElevation(meters: number): string {
  const feet = meters * 3.28084;
  return Math.round(feet).toLocaleString();
}

// Format speed in mph
function formatSpeed(metersPerSecond: number): string {
  const mph = metersPerSecond * 2.23694;
  return mph.toFixed(1);
}

// Calculate longest streak of consecutive days with activities
function calculateLongestStreak(activities: CachedActivity[]): { days: number; startDate: Date; endDate: Date } {
  if (activities.length === 0) return { days: 0, startDate: new Date(), endDate: new Date() };

  // Get unique activity dates sorted
  const dates = Array.from(new Set(
    activities.map(a => parseLocalDate(a.start_date_local).toDateString())
  )).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());

  let maxStreak = 1;
  let currentStreak = 1;
  let maxStreakStart = dates[0];
  let maxStreakEnd = dates[0];
  let currentStreakStart = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        maxStreakStart = currentStreakStart;
        maxStreakEnd = dates[i];
      }
    } else {
      currentStreak = 1;
      currentStreakStart = dates[i];
    }
  }

  return { days: maxStreak, startDate: maxStreakStart, endDate: maxStreakEnd };
}

// Analyze workout times to determine early bird / night owl
function analyzeWorkoutTimes(activities: CachedActivity[]): { pattern: string; peakHour: number; percentage: number } {
  const hourCounts: Record<number, number> = {};

  activities.forEach(a => {
    const hour = parseLocalDate(a.start_date_local).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0];

  if (!peakHour) return { pattern: 'Active', peakHour: 12, percentage: 0 };

  const hour = parseInt(peakHour[0]);
  const morningCount = Object.entries(hourCounts)
    .filter(([h]) => parseInt(h) >= 5 && parseInt(h) < 12)
    .reduce((sum, [, count]) => sum + count, 0);
  const eveningCount = Object.entries(hourCounts)
    .filter(([h]) => parseInt(h) >= 17 && parseInt(h) < 22)
    .reduce((sum, [, count]) => sum + count, 0);

  const total = activities.length;
  const morningPct = Math.round((morningCount / total) * 100);
  const eveningPct = Math.round((eveningCount / total) * 100);

  if (morningPct > eveningPct && morningPct > 30) {
    return { pattern: 'Early Bird', peakHour: hour, percentage: morningPct };
  } else if (eveningPct > morningPct && eveningPct > 30) {
    return { pattern: 'Night Owl', peakHour: hour, percentage: eveningPct };
  }
  return { pattern: 'All-Day Athlete', peakHour: hour, percentage: Math.max(morningPct, eveningPct) };
}

export function computeHighlights(activities: CachedActivity[], year: number): Highlight[] {
  if (activities.length === 0) return [];

  const highlights: Highlight[] = [];

  // Filter by sport type
  const rides = activities.filter(a => a.type === 'Ride' || a.sport_type === 'Ride');
  const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');

  // === RECORDS ===

  // Longest Ride
  if (rides.length > 0) {
    const longestRide = rides.reduce((max, a) => a.distance > max.distance ? a : max);
    highlights.push({
      type: 'record',
      title: 'Longest Ride',
      value: `${formatDistance(longestRide.distance)} miles`,
      subtitle: longestRide.name,
      activity: longestRide,
      icon: '🚴',
      color: 'from-orange-500 to-red-600',
    });
  }

  // Longest Run
  if (runs.length > 0) {
    const longestRun = runs.reduce((max, a) => a.distance > max.distance ? a : max);
    highlights.push({
      type: 'record',
      title: 'Longest Run',
      value: `${formatDistance(longestRun.distance)} miles`,
      subtitle: longestRun.name,
      activity: longestRun,
      icon: '🏃',
      color: 'from-green-500 to-teal-600',
    });
  }

  // Biggest Climb (exclude snowboarding)
  const climbActivities = activities.filter(a =>
    a.type !== 'Snowboard' && a.sport_type !== 'Snowboard'
  );
  if (climbActivities.length > 0) {
    const biggestClimb = climbActivities.reduce((max, a) =>
      a.total_elevation_gain > max.total_elevation_gain ? a : max
    );
    if (biggestClimb.total_elevation_gain > 0) {
      highlights.push({
        type: 'record',
        title: 'Biggest Climb',
        value: `${formatElevation(biggestClimb.total_elevation_gain)} ft`,
        subtitle: biggestClimb.name,
        activity: biggestClimb,
        icon: '⛰️',
        color: 'from-purple-500 to-indigo-600',
      });
    }
  }

  // Fastest Ride (avg speed)
  if (rides.length > 0) {
    const fastestRide = rides.reduce((max, a) => a.average_speed > max.average_speed ? a : max);
    highlights.push({
      type: 'record',
      title: 'Fastest Ride',
      value: `${formatSpeed(fastestRide.average_speed)} mph`,
      subtitle: fastestRide.name,
      activity: fastestRide,
      icon: '⚡',
      color: 'from-yellow-500 to-orange-600',
    });
  }

  // Peak Power (max watts)
  const ridesWithMaxPower = rides.filter(a => a.max_watts && a.max_watts > 0);
  if (ridesWithMaxPower.length > 0) {
    const peakPower = ridesWithMaxPower.reduce((max, a) =>
      (a.max_watts || 0) > (max.max_watts || 0) ? a : max
    );
    highlights.push({
      type: 'record',
      title: 'Peak Power',
      value: `${peakPower.max_watts} watts`,
      subtitle: peakPower.name,
      activity: peakPower,
      icon: '⚡',
      color: 'from-yellow-400 to-amber-600',
    });
  }

  // Longest Activity (by time)
  const longestActivity = activities.reduce((max, a) => a.moving_time > max.moving_time ? a : max);
  highlights.push({
    type: 'record',
    title: 'Longest Workout',
    value: formatDuration(longestActivity.moving_time),
    subtitle: longestActivity.name,
    activity: longestActivity,
    icon: '⏱️',
    color: 'from-blue-500 to-cyan-600',
  });

  // === SOCIAL ===

  // Most Kudos
  const mostKudos = activities.reduce((max, a) => a.kudos_count > max.kudos_count ? a : max);
  if (mostKudos.kudos_count > 0) {
    highlights.push({
      type: 'social',
      title: 'Most Kudos',
      value: `${mostKudos.kudos_count} kudos`,
      subtitle: mostKudos.name,
      activity: mostKudos,
      icon: '👏',
      color: 'from-pink-500 to-rose-600',
    });
  }

  // === PATTERNS ===

  // Longest Streak
  const streak = calculateLongestStreak(activities);
  if (streak.days > 1) {
    highlights.push({
      type: 'pattern',
      title: 'Longest Streak',
      value: `${streak.days} days`,
      subtitle: `${streak.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${streak.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      icon: '🔥',
      color: 'from-amber-500 to-orange-600',
    });
  }

  // Early Bird / Night Owl
  const timeAnalysis = analyzeWorkoutTimes(activities);
  highlights.push({
    type: 'pattern',
    title: timeAnalysis.pattern,
    value: `${timeAnalysis.percentage}%`,
    subtitle: timeAnalysis.pattern === 'Early Bird'
      ? 'of workouts before noon'
      : timeAnalysis.pattern === 'Night Owl'
        ? 'of workouts in the evening'
        : 'workouts spread throughout the day',
    icon: timeAnalysis.pattern === 'Early Bird' ? '🌅' : timeAnalysis.pattern === 'Night Owl' ? '🌙' : '☀️',
    color: timeAnalysis.pattern === 'Early Bird'
      ? 'from-yellow-400 to-orange-500'
      : timeAnalysis.pattern === 'Night Owl'
        ? 'from-indigo-600 to-purple-700'
        : 'from-sky-400 to-blue-500',
  });

  // === FUN COMPARISONS ===

  // Total Elevation vs Everest
  const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
  const everestHeight = 8848.86; // meters
  const everests = totalElevation / everestHeight;

  if (everests >= 0.5) {
    highlights.push({
      type: 'fun',
      title: 'Total Climbing',
      value: everests >= 1 ? `${everests.toFixed(1)}x Everest` : `${formatElevation(totalElevation)} ft`,
      subtitle: everests >= 1
        ? `${formatElevation(totalElevation)} ft total elevation`
        : `${(everests * 100).toFixed(0)}% of an Everest`,
      icon: '🏔️',
      color: 'from-slate-500 to-gray-700',
    });
  }

  // Total Distance comparison
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalMiles = totalDistance / 1609.34;

  // Fun distance comparisons
  let distanceComparison = '';
  if (totalMiles >= 2451) {
    distanceComparison = `Coast to coast (${Math.round(totalMiles / 2451)}x)`;
  } else if (totalMiles >= 1000) {
    distanceComparison = 'NYC to Miami and back';
  } else if (totalMiles >= 500) {
    distanceComparison = 'LA to San Francisco (round trip)';
  } else if (totalMiles >= 100) {
    distanceComparison = `${Math.round(totalMiles / 26.2)} marathons`;
  }

  if (distanceComparison) {
    highlights.push({
      type: 'fun',
      title: 'Total Distance',
      value: `${Math.round(totalMiles).toLocaleString()} miles`,
      subtitle: distanceComparison,
      icon: '🗺️',
      color: 'from-teal-500 to-cyan-600',
    });
  }

  // Year summary (always last)
  highlights.push({
    type: 'fun',
    title: `Your ${year}`,
    value: `${activities.length} workouts`,
    subtitle: `${Math.round(activities.reduce((sum, a) => sum + a.moving_time, 0) / 3600)} hours of movement`,
    icon: '🏆',
    color: 'from-strava-orange to-orange-600',
  });

  return highlights;
}
