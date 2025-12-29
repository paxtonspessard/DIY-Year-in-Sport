'use client';

import { format, parseISO } from 'date-fns';

// Strava incorrectly adds 'Z' suffix to start_date_local
// Strip it so parseISO treats it as local time, not UTC
function parseLocalDate(dateStr: string): Date {
  return parseISO(dateStr.replace('Z', ''));
}
import { useState, useEffect } from 'react';

interface Photo {
  unique_id: string;
  urls: {
    '100': string;
    '600': string;
  };
  caption?: string;
}

interface Activity {
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
  kudos_count: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

interface ActivitySidePanelProps {
  selectedDate: string | null;
  activities: Activity[];
  onClose: () => void;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return `${miles.toFixed(2)} mi`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

function formatPace(metersPerSecond: number, type: string): string {
  if (metersPerSecond === 0) return '-';

  // For running/walking, show min/mile
  if (type === 'Run' || type === 'Walk') {
    const secondsPerMile = 1609.34 / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /mi`;
  }

  // For cycling, show mph
  const mph = metersPerSecond * 2.23694;
  return `${mph.toFixed(1)} mph`;
}

function formatElevation(meters: number): string {
  const feet = meters * 3.28084;
  return `${Math.round(feet)} ft`;
}

function getActivityEmoji(type: string): string {
  const emojis: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Walk: '🚶',
    Hike: '🥾',
    WeightTraining: '🏋️',
    Yoga: '🧘',
    Swim: '🏊',
    Snowboard: '🏂',
    AlpineSki: '⛷️',
    Golf: '⛳',
  };
  return emojis[type] || '🏃';
}

function ActivityPhotos({ activityId }: { activityId: number }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await fetch(`/api/activities/${activityId}/photos`);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error('Failed to fetch photos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, [activityId]);

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">Loading photos...</div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {photos.map((photo) => (
          <button
            key={photo.unique_id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-strava-orange transition-all"
          >
            <img
              src={photo.urls['600']}
              alt={photo.caption || 'Activity photo'}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedPhoto.urls['600']}
            alt={selectedPhoto.caption || 'Activity photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {selectedPhoto.caption && (
            <div className="absolute bottom-4 left-4 right-4 text-center text-white bg-black/50 p-2 rounded">
              {selectedPhoto.caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ActivitySidePanel({ selectedDate, activities, onClose }: ActivitySidePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (selectedDate) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!shouldRender) return null;

  const dayActivities = activities
    .filter((a) => {
      const activityDate = format(parseLocalDate(a.start_date_local), 'yyyy-MM-dd');
      return activityDate === selectedDate;
    })
    .sort((a, b) => {
      // Sort by time, earliest first
      return parseLocalDate(a.start_date_local).getTime() - parseLocalDate(b.start_date_local).getTime();
    });

  const formattedDate = selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 z-50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{formattedDate}</h2>
            <p className="text-gray-400 text-sm">
              {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Activities */}
        <div className="p-4 space-y-4">
          {dayActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities on this day
            </div>
          ) : (
            dayActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-gray-800 rounded-xl p-4 space-y-3"
              >
                {/* Activity Header */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getActivityEmoji(activity.sport_type || activity.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{activity.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {format(parseLocalDate(activity.start_date_local), 'h:mm a')} · {activity.sport_type || activity.type}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {activity.distance > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Distance</div>
                      <div className="text-white font-semibold">{formatDistance(activity.distance)}</div>
                    </div>
                  )}

                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs uppercase">Duration</div>
                    <div className="text-white font-semibold">{formatTime(activity.moving_time)}</div>
                  </div>

                  {activity.distance > 0 && activity.average_speed > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">
                        {activity.type === 'Run' || activity.type === 'Walk' ? 'Pace' : 'Speed'}
                      </div>
                      <div className="text-white font-semibold">
                        {formatPace(activity.average_speed, activity.sport_type || activity.type)}
                      </div>
                    </div>
                  )}

                  {activity.total_elevation_gain > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Elevation</div>
                      <div className="text-white font-semibold">{formatElevation(activity.total_elevation_gain)}</div>
                    </div>
                  )}

                  {activity.average_heartrate && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Avg HR</div>
                      <div className="text-white font-semibold">{Math.round(activity.average_heartrate)} bpm</div>
                    </div>
                  )}

                  {activity.max_heartrate && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Max HR</div>
                      <div className="text-white font-semibold">{Math.round(activity.max_heartrate)} bpm</div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <ActivityPhotos activityId={activity.id} />

                {/* Kudos */}
                {activity.kudos_count > 0 && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm pt-2">
                    <span>👍</span>
                    <span>{activity.kudos_count} kudos</span>
                  </div>
                )}

                {/* View on Strava link */}
                <a
                  href={`https://www.strava.com/activities/${activity.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-strava-orange hover:text-strava-orange-dark text-sm font-medium pt-2"
                >
                  View on Strava →
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
