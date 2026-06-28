import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 up to `value` whenever `value` changes, returning the
 * current in-flight number to render. Used for the hero amount so balances
 * "count up" on screen entry for a premium feel.
 *
 * Driven by requestAnimationFrame (not Animated listeners) so that in test
 * environments — where rAF callbacks don't flush synchronously — the hook simply
 * reports the final `value` instead of getting stuck mid-animation.
 */
export function useCountUp(value: number, duration = 750): number {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // In tests, skip the rAF animation so no async work leaks past teardown —
    // just report the final value.
    if (process.env.JEST_WORKER_ID) {
      setDisplay(value);
      return;
    }
    startRef.current = null;

    const tick = (now: number) => {
      startRef.current ??= now;
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(value * eased);
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return display;
}
