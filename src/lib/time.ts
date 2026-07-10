// Pure time helpers (no React, no state).

// Formats a duration in seconds as "H:MM:SS" (hours omitted when zero → "M:SS").
export const formatDuration = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = minutes.toString().padStart(hours > 0 ? 2 : 1, '0');
  const ss = seconds.toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

// Converts seconds to minutes rounded to one decimal (used by the CSV export).
export const secondsToMinutes = (totalSeconds: number): number =>
  Math.round((totalSeconds / 60) * 10) / 10;
