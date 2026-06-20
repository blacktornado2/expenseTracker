import React, { ReactNode } from 'react';
import { View } from 'react-native';

type IconTileProps = {
  children: ReactNode;
  backgroundColor: string;
  size?: number;
  radius?: number;
};

export default function IconTile({ children, backgroundColor, size = 34, radius = 11 }: IconTileProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
