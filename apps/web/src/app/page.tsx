'use client';

import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleStravaConnect = () => {
    setIsConnecting(true);
    signIn('strava', { callbackUrl: '/dashboard' });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl md:text-7xl font-bold">
          Your <span className="text-strava-orange">Year in Sport</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
          Visualize your athletic achievements. See your stats, streaks, and highlights from the year.
        </p>

        {status === 'loading' ? (
          <div className="animate-pulse">Loading...</div>
        ) : session ? (
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/dashboard"
              onClick={() => setIsNavigating(true)}
              className="inline-flex items-center gap-3 bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              {isNavigating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                'View Your Dashboard'
              )}
            </Link>
            <button
              onClick={handleStravaConnect}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Re-connect Strava
            </button>
          </div>
        ) : (
          <button
            onClick={handleStravaConnect}
            disabled={isConnecting}
            className="inline-flex items-center justify-center gap-3 bg-strava-orange hover:bg-strava-orange-dark disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            {isConnecting ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Connect with Strava
              </>
            )}
          </button>
        )}
      </div>
    </main>
  );
}
