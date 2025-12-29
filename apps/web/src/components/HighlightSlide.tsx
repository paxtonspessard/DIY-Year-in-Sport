'use client';

import { Highlight } from '@/lib/highlights';

interface HighlightSlideProps {
  highlight: Highlight;
  isActive: boolean;
}

export function HighlightSlide({ highlight, isActive }: HighlightSlideProps) {
  const hasPhotos = highlight.photos && highlight.photos.length > 0;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${highlight.color} opacity-20`}
      />

      {/* Content wrapper - centered vertically */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">
        {/* Photo gallery - above text */}
        {hasPhotos && (
          <div
            className={`mb-6 transition-all duration-700 delay-100 ${
              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className={`flex gap-3 justify-center items-start ${
              highlight.photos!.length > 2 ? 'flex-wrap' : ''
            }`}>
              {highlight.photos!.slice(0, 4).map((url, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl shadow-2xl"
                >
                  <img
                    src={url}
                    alt=""
                    className={`object-cover ${
                      highlight.photos!.length === 1
                        ? 'max-h-[40vh] w-auto'
                        : highlight.photos!.length === 2
                          ? 'max-h-[35vh] w-auto'
                          : 'max-h-[28vh] w-auto'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text content */}
        <div className="text-center">
          {/* Icon */}
          <div
            className={`text-5xl md:text-6xl mb-6 transition-all duration-700 ${
              hasPhotos ? 'delay-200' : 'delay-100'
            } ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            {highlight.icon}
          </div>

          {/* Title */}
          <h2
            className={`text-sm md:text-base uppercase tracking-[0.2em] text-gray-500 mb-4 transition-all duration-700 ${
              hasPhotos ? 'delay-300' : 'delay-200'
            } ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            {highlight.title}
          </h2>

          {/* Value - using display font */}
          <div
            className={`font-display text-6xl md:text-8xl text-white mb-4 tracking-wide transition-all duration-700 ${
              hasPhotos ? 'delay-400' : 'delay-300'
            } ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            {highlight.value}
          </div>

          {/* Subtitle */}
          {highlight.subtitle && (
            <p
              className={`text-base md:text-lg text-gray-400 max-w-md mx-auto transition-all duration-700 ${
                hasPhotos ? 'delay-500' : 'delay-400'
              } ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
              {highlight.subtitle}
            </p>
          )}

          {/* Activity date */}
          {highlight.activity && (
            <div
              className={`mt-8 text-xs uppercase tracking-widest text-gray-600 transition-all duration-700 ${
                hasPhotos ? 'delay-600' : 'delay-500'
              } ${isActive ? 'opacity-100' : 'opacity-0'}`}
            >
              {highlight.activity.start_date_local.split('T')[0]}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
