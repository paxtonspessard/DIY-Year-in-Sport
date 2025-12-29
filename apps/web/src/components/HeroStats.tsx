'use client';

import { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useCountUp } from '@/hooks/useCountUp';

interface HeroStatsProps {
  totalDistance: number; // in meters
  totalTime: number; // in seconds
  totalActivities: number;
  totalElevation: number; // in meters
  monthlyTime: number[]; // array of 12 months, time in seconds per month
}

const ANIMATION_DURATION = 2000; // Match this to when count-up finishes

export function HeroStats({
  totalDistance,
  totalTime,
  totalActivities,
  totalElevation,
  monthlyTime,
}: HeroStatsProps) {
  // Convert to display units
  const distanceMiles = totalDistance / 1609.34;
  const elevationFeet = totalElevation * 3.28084;
  const timeHours = totalTime / 3600;

  // Animate the values
  const animatedActivities = useCountUp({ end: totalActivities, duration: 1500, delay: 100 });
  const animatedDistance = useCountUp({ end: distanceMiles, duration: 1500, delay: 200, decimals: 1 });
  const animatedElevation = useCountUp({ end: elevationFeet, duration: 1500, delay: 300 });

  // Track animation progress and completion
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  const [hasConfettied, setHasConfettied] = useState(false);

  // Animate the line drawing
  useEffect(() => {
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setShowNumber(true);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Confetti after animation completes
  useEffect(() => {
    if (!showNumber || hasConfettied) return;

    setHasConfettied(true);
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#FC4C02', '#ff9100', '#ffc400', '#22c55e', '#3b82f6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#FC4C02', '#ff9100', '#ffc400', '#22c55e', '#3b82f6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [showNumber, hasConfettied]);

  // Calculate cumulative time for the graph
  const cumulativeTime = useMemo(() => {
    const cumulative: number[] = [];
    let sum = 0;
    for (const time of monthlyTime) {
      sum += time;
      cumulative.push(sum);
    }
    return cumulative;
  }, [monthlyTime]);

  // Generate SVG path for the line graph
  const { linePath, areaPath, yAxisLabels, maxTimeHours } = useMemo(() => {
    const maxTimeSeconds = Math.max(...cumulativeTime, 1);
    const maxTimeHours = maxTimeSeconds / 3600;

    // Calculate nice Y-axis intervals
    const niceInterval = maxTimeHours > 200 ? 100 : maxTimeHours > 100 ? 50 : maxTimeHours > 50 ? 25 : 10;
    const yAxisLabels: number[] = [];
    for (let h = niceInterval; h < maxTimeHours; h += niceInterval) {
      yAxisLabels.push(h);
    }

    const width = 800;
    const height = 120;
    const padding = { left: 40, right: 20, top: 15, bottom: 25 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const points = cumulativeTime.map((time, i) => {
      const x = padding.left + (i / 11) * graphWidth;
      const y = padding.top + graphHeight - (time / maxTimeSeconds) * graphHeight;
      return { x, y };
    });

    // Line path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Area path (for gradient fill)
    const areaPath = `${linePath} L ${padding.left + graphWidth} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`;

    return { linePath, areaPath, yAxisLabels, maxTimeHours };
  }, [cumulativeTime]);

  // Format time for display
  const finalHours = Math.floor(timeHours);
  const finalMinutes = Math.round((timeHours - finalHours) * 60);

  return (
    <div className="card-elevated rounded-2xl p-8">
      {/* 4-Column Row Layout */}
      <div className="grid grid-cols-4 gap-4">
        {/* Activities */}
        <div className="flex flex-col items-center justify-center py-4">
          <svg className="w-6 h-6 mb-2 text-strava-orange" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <div className="font-display text-5xl md:text-6xl text-strava-orange tracking-wide">
            {animatedActivities.toLocaleString()}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">
            Activities
          </div>
        </div>

        {/* Moving Time (Ring) */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-28 h-28 md:w-32 md:h-32">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full -rotate-90"
            >
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#374151"
                strokeWidth="12"
                opacity="0.3"
              />

              {/* Progress ring */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#FC4C02"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 85}
                strokeDashoffset={2 * Math.PI * 85 * (1 - animationProgress)}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />

              {/* Month tick marks */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI;
                const innerR = 68;
                const outerR = 74;
                const x1 = 100 + innerR * Math.cos(angle);
                const y1 = 100 + innerR * Math.sin(angle);
                const x2 = 100 + outerR * Math.cos(angle);
                const y2 = 100 + outerR * Math.sin(angle);
                const isHighlighted = animationProgress >= (i / 12);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHighlighted ? '#FC4C02' : '#6b7280'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ transition: 'stroke 0.2s' }}
                  />
                );
              })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-2xl md:text-3xl text-gray-200 tracking-wide">
                {Math.floor(timeHours * animationProgress)}H
              </div>
              <div className="text-[9px] uppercase tracking-widest text-gray-500">
                Time
              </div>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="flex flex-col items-center justify-center py-4">
          <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <div className="font-display text-5xl md:text-6xl text-white tracking-wide">
            {animatedDistance.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">
            Miles
          </div>
        </div>

        {/* Elevation */}
        <div className="flex flex-col items-center justify-center py-4">
          <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 16H4l8-16z" />
          </svg>
          <div className="font-display text-5xl md:text-6xl text-white tracking-wide">
            {(animatedElevation / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">
            Feet Climbed
          </div>
        </div>
      </div>

      {/* Context line - spans full width */}
      <div
        className={`mt-6 pt-6 border-t border-gray-700/50 text-center transition-all duration-500 ${
          showNumber ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="text-gray-300 text-lg md:text-xl">
          <span className="text-strava-orange font-semibold">{(timeHours / 24).toFixed(1)} days</span> of movement
          <span className="mx-3 text-gray-600">•</span>
          <span className="text-gray-400">{Math.round(timeHours / 365 * 60)}min per day</span>
        </div>
      </div>

      {/*
      =====================================================
      LINE GRAPH VERSION (preserved for potential revert)
      =====================================================

      <div className="relative">
        <div className="text-sm uppercase tracking-widest text-gray-500 mb-4 text-center">
          Moving Time
        </div>

        <svg
          viewBox="0 0 800 120"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="timeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FC4C02" stopOpacity="0" />
            </linearGradient>
            <clipPath id="revealClip">
              <rect x="0" y="0" width={800 * animationProgress} height="120" />
            </clipPath>
          </defs>

          {yAxisLabels.map((hours) => {
            const y = 15 + 80 - (hours / maxTimeHours) * 80;
            return (
              <g key={hours}>
                <text x="35" y={y + 3} textAnchor="end" className="fill-gray-600 text-[9px]"
                  style={{ opacity: animationProgress > 0.1 ? 0.6 : 0, transition: 'opacity 0.3s' }}>
                  {hours}h
                </text>
                <line x1="40" y1={y} x2="780" y2={y} stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4"
                  style={{ opacity: animationProgress > 0.1 ? 0.3 : 0, transition: 'opacity 0.3s' }} />
              </g>
            );
          })}

          <path d={areaPath} fill="url(#timeGradient)" clipPath="url(#revealClip)" />
          <path d={linePath} fill="none" stroke="#FC4C02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#revealClip)" />

          <text x="40" y="112" textAnchor="start" className="fill-gray-500 text-[10px]"
            style={{ opacity: animationProgress > 0 ? 0.8 : 0.3, transition: 'opacity 0.3s' }}>Jan</text>
          <text x="410" y="112" textAnchor="middle" className="fill-gray-500 text-[10px]"
            style={{ opacity: animationProgress > 0.4 ? 0.8 : 0.3, transition: 'opacity 0.3s' }}>Jun</text>
          <text x="780" y="112" textAnchor="end" className="fill-gray-500 text-[10px]"
            style={{ opacity: animationProgress > 0.9 ? 0.8 : 0.3, transition: 'opacity 0.3s' }}>Dec</text>
        </svg>

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 pointer-events-none ${
            showNumber ? 'opacity-100' : 'opacity-0'
          }`} style={{ top: '24px' }}>
          <div className="bg-[#1a1a1a]/85 backdrop-blur-sm px-8 py-4 rounded-2xl">
            <div className="font-display text-5xl md:text-6xl text-gray-200 tracking-wide text-center">
              {finalHours}H {finalMinutes}M
            </div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
