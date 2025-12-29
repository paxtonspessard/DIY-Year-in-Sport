'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  const needsReauth = error.message?.includes('sign in') ||
                      error.message?.includes('token') ||
                      error.message?.includes('Unauthorized');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
      <div className="text-center space-y-6 px-4 max-w-md">
        <div className="text-6xl">
          {needsReauth ? '🔐' : '⚠️'}
        </div>

        <h1 className="text-2xl font-bold">
          {needsReauth ? 'Session Expired' : 'Something went wrong'}
        </h1>

        <p className="text-gray-400">
          {needsReauth
            ? 'Your Strava connection has expired. Please sign in again to continue.'
            : error.message || 'Failed to load your dashboard. Please try again.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {needsReauth ? (
            <Link
              href="/"
              className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In Again
            </Link>
          ) : (
            <>
              <button
                onClick={reset}
                className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Go Home
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
