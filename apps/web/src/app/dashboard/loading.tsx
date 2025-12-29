export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Strava logo */}
        <div className="relative">
          <svg
            className="w-24 h-24 mx-auto text-strava-orange animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Loading Your Year in Sport</h2>
          <p className="text-gray-400">Fetching your activities from Strava...</p>
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-strava-orange border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </main>
  );
}
