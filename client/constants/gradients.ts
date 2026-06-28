/**
 * Emerald Luxe gradient system — the single source of truth for every
 * LinearGradient in the app. Gradients are rich, multi-stop and diagonal to
 * read as "premium" rather than flat fills.
 *
 * expo-linear-gradient types `colors` as a readonly tuple of >= 2 colors, so
 * each constant is declared `as const`.
 */

import { type LinearGradientPoint } from 'expo-linear-gradient';

// Diagonal sweep (top-left → bottom-right) gives gradients depth vs. a flat
// vertical wash. Spread these onto a LinearGradient: {...GRADIENT_DIAGONAL}.
export const GRADIENT_DIAGONAL: { start: LinearGradientPoint; end: LinearGradientPoint } = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// Primary brand: soft-lime → teal → deep emerald. Used for hero cards, the FAB
// and the profile card.
export const GRADIENT_BRAND = ['#1FD17C', '#0FB388', '#0A9E5E'] as const;

// Tighter two-stop emerald for primary buttons (less surface area → fewer stops
// reads cleaner at small sizes).
export const GRADIENT_BRAND_BUTTON = ['#17C879', '#0A9E5E'] as const;

// Expense / destructive actions: coral → crimson.
export const GRADIENT_RED = ['#FF6A5E', '#E8322A', '#C0241D'] as const;

// Income quick-action (a brighter cut of the brand for contrast on the dashboard).
export const GRADIENT_INCOME = ['#34E08A', '#12B86C', '#0A9E5E'] as const;

// Violet quick-action (savings / secondary).
export const GRADIENT_VIOLET = ['#A78BFA', '#7C5CFC', '#6D28D9'] as const;

// Brushed-gold accent (hairline highlights on dark / hero surfaces).
export const ACCENT_GOLD = '#D9B25F';

// ── Per-category gradients ──────────────────────────────────────────────────
// Derive a 3-stop gradient from any base category color so each category tile /
// selected chip glows in its own hue with real depth.

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Mix a hex color toward white by `ratio` (0..1). */
export function lighten(hex: string, ratio: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * ratio, g + (255 - g) * ratio, b + (255 - b) * ratio);
}

/** Mix a hex color toward black by `ratio` (0..1). */
export function darken(hex: string, ratio: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - ratio), g * (1 - ratio), b * (1 - ratio));
}

/** A rich 3-stop gradient (light → base → deep) for a given category color. */
export function gradientFor(color: string): readonly [string, string, string] {
  return [lighten(color, 0.22), color, darken(color, 0.16)];
}
