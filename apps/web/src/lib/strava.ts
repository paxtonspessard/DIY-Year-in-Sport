import { db } from './db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaActivity {
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

export interface StravaStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: ActivityTotal;
  recent_run_totals: ActivityTotal;
  recent_swim_totals: ActivityTotal;
  ytd_ride_totals: ActivityTotal;
  ytd_run_totals: ActivityTotal;
  ytd_swim_totals: ActivityTotal;
  all_ride_totals: ActivityTotal;
  all_run_totals: ActivityTotal;
  all_swim_totals: ActivityTotal;
}

export interface ActivityTotal {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokens> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Strava token');
  }

  return response.json();
}

// Get a valid access token for a user, refreshing if expired
export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('User not found - please sign in again');
  }

  if (!user.refreshToken) {
    throw new Error('No refresh token - please sign in again');
  }

  const now = Math.floor(Date.now() / 1000);

  // If token expires in less than 5 minutes, refresh it
  if (user.tokenExpiresAt <= now + 300) {
    try {
      const tokens = await refreshStravaToken(user.refreshToken);

      // Update tokens in database
      await db
        .update(users)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: tokens.expires_at,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh Strava token - please sign in again');
    }
  }

  return user.accessToken;
}

export async function getStravaAthlete(accessToken: string): Promise<StravaAthlete> {
  const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Strava athlete');
  }

  return response.json();
}

export async function getStravaActivities(
  accessToken: string,
  options: { before?: number; after?: number; page?: number; perPage?: number } = {}
): Promise<StravaActivity[]> {
  const params = new URLSearchParams();
  if (options.before) params.set('before', options.before.toString());
  if (options.after) params.set('after', options.after.toString());
  params.set('page', (options.page || 1).toString());
  params.set('per_page', (options.perPage || 100).toString());

  const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Strava activities');
  }

  return response.json();
}

export async function getStravaStats(accessToken: string, athleteId: number): Promise<StravaStats> {
  const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Strava stats');
  }

  return response.json();
}

export interface StravaPhoto {
  unique_id: string;
  urls: {
    '100': string;
    '600': string;
  };
  caption?: string;
}

export async function getActivityPhotos(
  accessToken: string,
  activityId: number
): Promise<StravaPhoto[]> {
  const response = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/photos?photo_sources=true&size=600`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    // Photos might not exist or rate limited, return empty array
    return [];
  }

  return response.json();
}

export async function getAllActivitiesForYear(
  accessToken: string,
  year: number = new Date().getFullYear()
): Promise<StravaActivity[]> {
  const startOfYear = new Date(year, 0, 1).getTime() / 1000;
  const endOfYear = new Date(year + 1, 0, 1).getTime() / 1000;

  const allActivities: StravaActivity[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const activities = await getStravaActivities(accessToken, {
      after: startOfYear,
      before: endOfYear,
      page,
      perPage: 100,
    });

    allActivities.push(...activities);
    hasMore = activities.length === 100;
    page++;

    // Rate limiting protection
    if (page > 50) break; // Safety limit
  }

  return allActivities;
}
