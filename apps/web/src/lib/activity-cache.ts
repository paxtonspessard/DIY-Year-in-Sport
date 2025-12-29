import { db } from './db';
import { activities } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { getAllActivitiesForYear, StravaActivity } from './strava';

export interface CachedActivity {
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
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
}

// Convert database activity to the format expected by components
function dbActivityToCached(dbActivity: typeof activities.$inferSelect): CachedActivity {
  return {
    id: dbActivity.stravaId,
    name: dbActivity.name,
    type: dbActivity.type,
    sport_type: dbActivity.sportType || dbActivity.type,
    distance: dbActivity.distance || 0,
    moving_time: dbActivity.movingTime || 0,
    elapsed_time: dbActivity.elapsedTime || 0,
    total_elevation_gain: dbActivity.totalElevationGain || 0,
    start_date: dbActivity.startDate,
    start_date_local: dbActivity.startDateLocal,
    timezone: dbActivity.timezone || '',
    kudos_count: dbActivity.kudosCount || 0,
    average_speed: (dbActivity.averageSpeed || 0) / 1000, // Convert back from stored format
    max_speed: (dbActivity.maxSpeed || 0) / 1000,
    average_heartrate: dbActivity.averageHeartrate || undefined,
    max_heartrate: dbActivity.maxHeartrate || undefined,
    average_watts: dbActivity.averageWatts || undefined,
    max_watts: dbActivity.maxWatts || undefined,
    weighted_average_watts: dbActivity.weightedAverageWatts || undefined,
  };
}

// Get cached activities for a user and year
export async function getCachedActivities(
  userId: string,
  year: number
): Promise<CachedActivity[]> {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year + 1}-01-01`;

  const cachedActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.startDateLocal, startOfYear),
      lt(activities.startDateLocal, endOfYear)
    ),
    orderBy: (activities, { desc }) => [desc(activities.startDateLocal)],
  });

  return cachedActivities.map(dbActivityToCached);
}

// Check if we have cached activities for a user and year
export async function hasCachedActivities(userId: string, year: number): Promise<boolean> {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year + 1}-01-01`;

  const count = await db.query.activities.findFirst({
    where: and(
      eq(activities.userId, userId),
      gte(activities.startDateLocal, startOfYear),
      lt(activities.startDateLocal, endOfYear)
    ),
  });

  return !!count;
}

// Get the last sync time for a user
export async function getLastSyncTime(userId: string): Promise<Date | null> {
  const lastActivity = await db.query.activities.findFirst({
    where: eq(activities.userId, userId),
    orderBy: (activities, { desc }) => [desc(activities.fetchedAt)],
  });

  return lastActivity?.fetchedAt || null;
}

// Sync activities from Strava to local database
export async function syncActivitiesFromStrava(
  accessToken: string,
  userId: string,
  year: number
): Promise<CachedActivity[]> {
  // Fetch from Strava
  const stravaActivities = await getAllActivitiesForYear(accessToken, year);

  // Upsert each activity into the database
  for (const activity of stravaActivities) {
    await db
      .insert(activities)
      .values({
        userId,
        stravaId: activity.id,
        name: activity.name,
        type: activity.type,
        sportType: activity.sport_type,
        distance: Math.round(activity.distance),
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        totalElevationGain: Math.round(activity.total_elevation_gain),
        startDate: activity.start_date,
        startDateLocal: activity.start_date_local,
        timezone: activity.timezone,
        kudosCount: activity.kudos_count,
        averageSpeed: Math.round(activity.average_speed * 1000), // Store as integer
        maxSpeed: Math.round(activity.max_speed * 1000),
        averageHeartrate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
        maxHeartrate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
        averageWatts: activity.average_watts ? Math.round(activity.average_watts) : null,
        maxWatts: activity.max_watts ? Math.round(activity.max_watts) : null,
        weightedAverageWatts: activity.weighted_average_watts ? Math.round(activity.weighted_average_watts) : null,
        data: activity as unknown as Record<string, unknown>,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: activities.stravaId,
        set: {
          name: activity.name,
          kudosCount: activity.kudos_count,
          averageWatts: activity.average_watts ? Math.round(activity.average_watts) : null,
          maxWatts: activity.max_watts ? Math.round(activity.max_watts) : null,
          weightedAverageWatts: activity.weighted_average_watts ? Math.round(activity.weighted_average_watts) : null,
          data: activity as unknown as Record<string, unknown>,
          fetchedAt: new Date(),
        },
      });
  }

  // Return the activities in the expected format
  return stravaActivities.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    sport_type: a.sport_type,
    distance: a.distance,
    moving_time: a.moving_time,
    elapsed_time: a.elapsed_time,
    total_elevation_gain: a.total_elevation_gain,
    start_date: a.start_date,
    start_date_local: a.start_date_local,
    timezone: a.timezone,
    kudos_count: a.kudos_count,
    average_speed: a.average_speed,
    max_speed: a.max_speed,
    average_heartrate: a.average_heartrate,
    max_heartrate: a.max_heartrate,
    average_watts: a.average_watts,
    max_watts: a.max_watts,
    weighted_average_watts: a.weighted_average_watts,
  }));
}

// Get activities, using cache if available, otherwise sync from Strava
export async function getActivitiesWithCache(
  accessToken: string,
  userId: string,
  year: number,
  forceRefresh = false
): Promise<CachedActivity[]> {
  // Check if we should use cache
  if (!forceRefresh) {
    const hasCache = await hasCachedActivities(userId, year);
    if (hasCache) {
      console.log('[Cache] Using cached activities');
      return getCachedActivities(userId, year);
    }
  }

  // Sync from Strava
  console.log('[Cache] Syncing activities from Strava');
  return syncActivitiesFromStrava(accessToken, userId, year);
}
