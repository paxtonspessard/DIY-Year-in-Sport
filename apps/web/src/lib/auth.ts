import { AuthOptions } from 'next-auth';
import { db } from './db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface StravaProfile {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

export const authOptions: AuthOptions = {
  providers: [
    {
      id: 'strava',
      name: 'Strava',
      type: 'oauth',
      authorization: {
        url: 'https://www.strava.com/oauth/authorize',
        params: {
          scope: 'read,activity:read_all,profile:read_all',
          response_type: 'code',
        },
      },
      token: {
        url: 'https://www.strava.com/oauth/token',
        async request({ params, provider }) {
          console.log('[Strava Auth] Exchanging code for token...');
          const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: provider.clientId as string,
              client_secret: provider.clientSecret as string,
              code: params.code as string,
              grant_type: 'authorization_code',
            }),
          });
          const tokens = await response.json();
          console.log('[Strava Auth] Token response status:', response.status);
          if (!response.ok) {
            console.error('[Strava Auth] Token error:', JSON.stringify(tokens));
          }
          return { tokens };
        },
      },
      userinfo: 'https://www.strava.com/api/v3/athlete',
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: `${profile.firstname} ${profile.lastname}`,
          image: profile.profile,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const stravaProfile = profile as StravaProfile;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.stravaId = stravaProfile.id;

        // Store/update user in database
        const existingUser = await db.query.users.findFirst({
          where: eq(users.stravaId, token.stravaId as number),
        });

        if (existingUser) {
          await db
            .update(users)
            .set({
              accessToken: account.access_token as string,
              refreshToken: account.refresh_token as string,
              tokenExpiresAt: account.expires_at as number,
              athleteName: stravaProfile.firstname + ' ' + stravaProfile.lastname,
              athleteProfile: stravaProfile.profile,
              updatedAt: new Date(),
            })
            .where(eq(users.stravaId, token.stravaId as number));
          token.userId = existingUser.id;
        } else {
          const newUserId = uuidv4();
          await db.insert(users).values({
            id: newUserId,
            stravaId: token.stravaId as number,
            accessToken: account.access_token as string,
            refreshToken: account.refresh_token as string,
            tokenExpiresAt: account.expires_at as number,
            athleteName: stravaProfile.firstname + ' ' + stravaProfile.lastname,
            athleteProfile: stravaProfile.profile,
          });
          token.userId = newUserId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.userId as string;
      session.stravaId = token.stravaId as number;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
