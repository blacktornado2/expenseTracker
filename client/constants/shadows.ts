import { ViewStyle } from 'react-native';

export const SHADOW_CARD: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.05,
  shadowRadius: 22,
  elevation: 4,
};

export const SHADOW_TX: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.04,
  shadowRadius: 18,
  elevation: 3,
};

export const SHADOW_HERO: ViewStyle = {
  shadowColor: '#0FB46B',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.32,
  shadowRadius: 38,
  elevation: 10,
};

// Tinted shadow for small gradient cards (Income, Saved) — glows in the card's own color.
export function shadowForGradientCard(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  };
}

// Numpad key — subtle in light, deepened in dark (spec dark token table).
export const SHADOW_KEY: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

export const SHADOW_KEY_DARK: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 7,
  elevation: 3,
};

// Tab bar — light in light mode, deepened in dark.
export const SHADOW_TAB: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 8,
};

export const SHADOW_TAB_DARK: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 16,
};
