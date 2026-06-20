import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOW_CARD } from '@/constants/shadows';

type CardProps = {
  children: ReactNode;
  radius?: number;
  className?: string;
  style?: ViewStyle;
};

export default function Card({ children, radius = 24, className = '', style }: CardProps) {
  const { isDark } = useTheme();
  const shadowStyle: ViewStyle = isDark ? {} : SHADOW_CARD;

  return (
    <View
      className={`bg-bg-card dark:bg-bg-card-dark ${className}`}
      style={[{ borderRadius: radius }, shadowStyle, style]}
    >
      {children}
    </View>
  );
}
