import { useEffect, useState } from 'react';
import { useTimersStore } from '@/timers/store/timers.store';

// Returns the current epoch ms, re-rendering every second only while a timer is
// running. When nothing runs there is no interval, so idle screens stay quiet.
export const useNow = (): number => {
  const isRunning = useTimersStore((state) => state.runningId !== null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return now;
};
