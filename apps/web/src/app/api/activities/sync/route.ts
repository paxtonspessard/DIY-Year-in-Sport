import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/strava';
import { syncActivitiesFromStrava } from '@/lib/activity-cache';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { year } = await request.json();
    const accessToken = await getValidAccessToken(session.userId);
    const activities = await syncActivitiesFromStrava(
      accessToken,
      session.userId,
      year || new Date().getFullYear()
    );

    return NextResponse.json({
      success: true,
      count: activities.length,
      message: `Synced ${activities.length} activities`,
    });
  } catch (error) {
    console.error('Error syncing activities:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync activities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
