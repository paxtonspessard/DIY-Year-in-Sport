'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Highlight } from '@/lib/highlights';
import { HighlightSlide } from './HighlightSlide';

interface HighlightsSlideshowProps {
  highlights: Highlight[];
  year: number;
  onClose: () => void;
}

interface StravaPhoto {
  unique_id: string;
  urls: {
    '100': string;
    '600': string;
  };
  caption?: string;
}

export function HighlightsSlideshow({ highlights: initialHighlights, year, onClose }: HighlightsSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introAnimated, setIntroAnimated] = useState(false);
  const [highlights, setHighlights] = useState(initialHighlights);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    // Stagger intro animations
    setTimeout(() => setIntroAnimated(true), 100);
  }, []);

  // Fetch photos for highlights with activities
  useEffect(() => {
    async function fetchPhotos() {
      const activityIds = new Set<number>();
      const photoMap = new Map<number, string[]>();

      // Collect unique activity IDs
      initialHighlights.forEach(h => {
        if (h.activity) {
          activityIds.add(h.activity.id);
        }
      });

      // Fetch photos for each activity in parallel
      await Promise.all(
        Array.from(activityIds).map(async (activityId) => {
          try {
            const res = await fetch(`/api/activities/${activityId}/photos`);
            if (res.ok) {
              const photos: StravaPhoto[] = await res.json();
              if (photos.length > 0) {
                // Get all photo URLs (use 600px size for quality)
                photoMap.set(activityId, photos.map(p => p.urls['600']));
              }
            }
          } catch (e) {
            // Silently fail - photo is optional
          }
        })
      );

      // Update highlights with photos
      if (photoMap.size > 0) {
        setHighlights(prev => prev.map(h => {
          if (h.activity && photoMap.has(h.activity.id)) {
            return { ...h, photos: photoMap.get(h.activity.id) };
          }
          return h;
        }));
      }
    }

    fetchPhotos();
  }, [initialHighlights]);

  const goNext = useCallback(() => {
    if (showIntro) {
      setShowIntro(false);
      return;
    }
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Close on last slide
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  }, [showIntro, currentIndex, highlights.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, handleClose]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setTouchStart(null);
  };

  const content = (
    <div
      className={`fixed inset-0 z-[9999] bg-gray-900 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={goNext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute top-6 right-6 z-[10000] p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Intro Screen */}
      {showIntro && (
        <div className="absolute inset-0 z-50 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-strava-orange via-orange-500 to-amber-500 animate-gradient-shift" />

          {/* Floating orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute w-[600px] h-[600px] rounded-full bg-white/10 blur-3xl transition-all duration-1000 ${
              introAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`} style={{ top: '-20%', right: '-10%' }} />
            <div className={`absolute w-[400px] h-[400px] rounded-full bg-amber-300/20 blur-3xl transition-all duration-1000 delay-200 ${
              introAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`} style={{ bottom: '-10%', left: '-5%' }} />
            <div className={`absolute w-[300px] h-[300px] rounded-full bg-red-500/10 blur-3xl transition-all duration-1000 delay-400 ${
              introAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`} style={{ top: '40%', left: '60%' }} />
          </div>

          {/* Radial lines pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[...Array(24)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 60 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 60 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke="white"
                  strokeWidth="0.2"
                />
              ))}
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
            {/* Year badge */}
            <div className={`mb-8 transition-all duration-700 ${
              introAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="text-sm font-medium text-white tracking-wide">{year} RECAP</span>
              </div>
            </div>

            {/* Main text */}
            <h1 className={`text-center mb-4 transition-all duration-700 delay-150 ${
              introAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <span className="block font-display text-5xl md:text-7xl lg:text-8xl text-white tracking-wide">
                READY TO SEE
              </span>
              <span className="block font-display text-5xl md:text-7xl lg:text-8xl text-white/90 tracking-wide">
                YOUR YEAR?
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-center text-white/70 text-lg md:text-xl max-w-md mb-12 transition-all duration-700 delay-300 ${
              introAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {highlights.length} highlights from your athletic journey
            </p>

            {/* CTA */}
            <div className={`transition-all duration-700 delay-500 ${
              introAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIntro(false);
                }}
                className="group relative px-8 py-4 bg-white text-strava-orange font-semibold rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Let's Go
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

          </div>

          {/* Bottom hint */}
          <div className={`absolute bottom-8 left-0 right-0 text-center transition-all duration-700 delay-900 ${
            introAnimated ? 'opacity-100' : 'opacity-0'
          }`}>
            <span className="text-white/40 text-xs uppercase tracking-widest">Tap anywhere to begin</span>
          </div>
        </div>
      )}

      {/* Progress bar - only show after intro */}
      {!showIntro && (
        <div className="absolute top-0 left-0 right-0 z-40 flex gap-1.5 p-6">
          {highlights.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/10"
            >
              <div
                className={`h-full bg-strava-orange transition-all duration-300 ${
                  index < currentIndex ? 'w-full' : index === currentIndex ? 'w-full shadow-glow-orange-sm' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Slides */}
      <div className={`relative w-full h-full transition-opacity duration-500 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        {highlights.map((highlight, index) => (
          <HighlightSlide
            key={index}
            highlight={highlight}
            isActive={index === currentIndex && !showIntro}
          />
        ))}
      </div>

      {/* Navigation hints - only show after intro */}
      {!showIntro && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 text-gray-600 text-xs uppercase tracking-widest">
          <span>Tap or → to continue</span>
          {currentIndex > 0 && <span>← to go back</span>}
        </div>
      )}

      {/* Slide counter - only show after intro */}
      {!showIntro && (
        <div className="absolute bottom-6 right-6 font-display text-2xl text-gray-700">
          {currentIndex + 1}<span className="text-gray-800">/</span>{highlights.length}
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level for true fullscreen
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
