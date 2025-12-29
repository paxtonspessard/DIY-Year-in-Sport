import {
  StravaTokens,
  StravaAthlete,
  StravaActivity,
  StravaStats,
  GetActivitiesParams,
} from './types.js';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export class StravaClient {
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private expiresAt: number;

  constructor(config: {
    accessToken: string;
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    expiresAt?: number;
  }) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.expiresAt = config.expiresAt || 0;
  }

  private async ensureValidToken(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    if (this.expiresAt && now >= this.expiresAt - 60) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const tokens = (await response.json()) as StravaTokens;
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = tokens.expires_at;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureValidToken();

    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.request<StravaAthlete>('/athlete');
  }

  async getActivities(params: GetActivitiesParams = {}): Promise<StravaActivity[]> {
    const searchParams = new URLSearchParams();
    if (params.before) searchParams.set('before', params.before.toString());
    if (params.after) searchParams.set('after', params.after.toString());
    searchParams.set('page', (params.page || 1).toString());
    searchParams.set('per_page', (params.per_page || 30).toString());

    return this.request<StravaActivity[]>(`/athlete/activities?${searchParams}`);
  }

  async getActivityStats(athleteId: number): Promise<StravaStats> {
    return this.request<StravaStats>(`/athletes/${athleteId}/stats`);
  }

  async getActivity(activityId: number): Promise<StravaActivity> {
    return this.request<StravaActivity>(`/activities/${activityId}`);
  }

  async getAllActivitiesForYear(year: number = new Date().getFullYear()): Promise<StravaActivity[]> {
    const startOfYear = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const endOfYear = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);

    const allActivities: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const activities = await this.getActivities({
        after: startOfYear,
        before: endOfYear,
        page,
        per_page: 100,
      });

      allActivities.push(...activities);
      hasMore = activities.length === 100;
      page++;

      // Safety limit to prevent infinite loops
      if (page > 50) break;
    }

    return allActivities;
  }
}
