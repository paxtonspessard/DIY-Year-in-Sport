import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/strava';
import { getActivitiesWithCache } from '@/lib/activity-cache';
import { DashboardContent } from '@/components/DashboardContent';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const year = new Date().getFullYear();

  // Get user info from database (includes athlete name/profile)
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user) {
    redirect('/');
  }

  // Get valid access token (refreshes if expired)
  const accessToken = await getValidAccessToken(session.userId);

  // Get activities (uses cache if available)
  const activities = await getActivitiesWithCache(accessToken, session.userId, year);

  // Use cached athlete info from user record
  const athlete = {
    firstname: user.athleteName?.split(' ')[0] || 'Athlete',
    lastname: user.athleteName?.split(' ').slice(1).join(' ') || '',
    profile: user.athleteProfile || '',
  };

  return (
    <main className="min-h-screen bg-[#f5f3ef] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardContent
          activities={activities}
          athlete={athlete}
          year={year}
          userId={session.userId}
        />
      </div>
    </main>
  );
}
